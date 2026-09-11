import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Sharing from "expo-sharing";

import {
  downloadQuotePdf,
  getQuote,
  sendQuote,
} from "../api";


const STATUS_LABELS = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CHANGE_REQUESTED:
    "Modification demandée",
};


function formatMoney(value) {
  return (
    Number(value || 0)
      .toFixed(2)
      .replace(".", ",") +
    " €"
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "fr-FR"
  );
}


export default function QuoteDetailScreen({
  route,
  navigation,
}) {
  const {
    quoteId,
  } = route.params;

  const [
    quote,
    setQuote,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    downloading,
    setDownloading,
  ] = useState(false);


  const loadQuote =
    useCallback(
      async (
        refresh = false
      ) => {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const data =
            await getQuote(
              quoteId
            );

          setQuote(data);
        } catch (error) {
          Alert.alert(
            "Devis",
            error?.message ||
              "Impossible de charger le devis."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [quoteId]
    );


  useEffect(() => {
    loadQuote();
  }, [loadQuote]);


  function confirmSend() {
    Alert.alert(
      "Envoyer le devis",
      `Envoyer le devis ${quote.reference} au client ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Envoyer",
          onPress:
            async () => {
              setSending(true);

              try {
                const result =
                  await sendQuote(
                    quote.id
                  );

                Alert.alert(
                  "Devis envoyé",
                  result?.detail ||
                    "Le devis a été envoyé."
                );

                await loadQuote(
                  true
                );
              } catch (error) {
                Alert.alert(
                  "Devis",
                  error?.message ||
                    "Impossible d'envoyer le devis."
                );
              } finally {
                setSending(false);
              }
            },
        },
      ]
    );
  }


  async function downloadPdf() {
    setDownloading(true);

    try {
      const uri =
        await downloadQuotePdf(
          quote.id,
          quote.reference
        );

      const available =
        await Sharing
          .isAvailableAsync();

      if (!available) {
        Alert.alert(
          "PDF téléchargé",
          uri
        );

        return;
      }

      await Sharing.shareAsync(
        uri,
        {
          mimeType:
            "application/pdf",

          UTI:
            "com.adobe.pdf",

          dialogTitle:
            `Devis ${quote.reference}`,
        }
      );
    } catch (error) {
      Alert.alert(
        "PDF",
        error?.message ||
          "Impossible de télécharger le PDF."
      );
    } finally {
      setDownloading(false);
    }
  }


  if (loading) {
    return (
      <View
        style={
          styles.centerState
        }
      >
        <ActivityIndicator
          size="large"
          color="#ee5a2b"
        />
      </View>
    );
  }


  if (!quote) {
    return (
      <View
        style={
          styles.centerState
        }
      >
        <Text>
          Devis introuvable.
        </Text>
      </View>
    );
  }


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() =>
            loadQuote(true)
          }
        />
      }
    >
      <TouchableOpacity
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text
          style={styles.back}
        >
          ← Devis
        </Text>
      </TouchableOpacity>

      <Text
        style={styles.eyebrow}
      >
        DEVIS
      </Text>

      <Text
        style={styles.title}
      >
        {quote.reference}
      </Text>

      <View
        style={
          styles.statusBadge
        }
      >
        <Text
          style={
            styles.statusText
          }
        >
          {STATUS_LABELS[
            quote.status
          ] ||
            quote.status}
        </Text>
      </View>

      <Text
        style={styles.date}
      >
        Créé le{" "}
        {formatDate(
          quote.created_at
        )}
      </Text>

      <View
        style={styles.card}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Prestations
        </Text>

        {(quote.items || []).map(
          (item) => (
            <View
              key={item.id}
              style={
                styles.itemRow
              }
            >
              <Text
                style={
                  styles.itemLabel
                }
              >
                {item.label}
              </Text>

              <Text
                style={
                  styles.itemAmount
                }
              >
                {formatMoney(
                  item.amount_ht
                )}
              </Text>
            </View>
          )
        )}

        <View
          style={styles.separator}
        />

        <View
          style={styles.totalRow}
        >
          <Text
            style={
              styles.totalLabel
            }
          >
            Total HT
          </Text>

          <Text
            style={
              styles.totalValue
            }
          >
            {formatMoney(
              quote.total_ht
            )}
          </Text>
        </View>

        <View
          style={styles.totalRow}
        >
          <Text
            style={
              styles.totalLabel
            }
          >
            TVA
          </Text>

          <Text
            style={
              styles.totalValue
            }
          >
            {formatMoney(
              quote.total_tva
            )}
          </Text>
        </View>

        <View
          style={[
            styles.totalRow,
            styles.ttcRow,
          ]}
        >
          <Text
            style={styles.ttcLabel}
          >
            Total TTC
          </Text>

          <Text
            style={styles.ttcValue}
          >
            {formatMoney(
              quote.total_ttc
            )}
          </Text>
        </View>
      </View>

      {quote.status ===
      "DRAFT" ? (
        <TouchableOpacity
          style={
            styles.sendButton
          }
          disabled={sending}
          onPress={confirmSend}
        >
          {sending ? (
            <ActivityIndicator
              color="#fff"
            />
          ) : (
            <Text
              style={
                styles.sendText
              }
            >
              Envoyer au client
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <View
          style={
            styles.sentBox
          }
        >
          <Text
            style={
              styles.sentText
            }
          >
            Statut :{" "}
            {STATUS_LABELS[
              quote.status
            ] ||
              quote.status}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={
          styles.pdfButton
        }
        disabled={downloading}
        onPress={downloadPdf}
      >
        {downloading ? (
          <ActivityIndicator
            color="#171614"
          />
        ) : (
          <Text
            style={
              styles.pdfText
            }
          >
            Télécharger le PDF
          </Text>
        )}
      </TouchableOpacity>

      <Text
        style={styles.pdfHelp}
      >
        Sur iPhone, choisis
        « Enregistrer dans Fichiers »
        dans la feuille de partage.
      </Text>
    </ScrollView>
  );
}


const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f7f4ee",
    },

    content: {
      paddingTop: 58,
      paddingHorizontal: 22,
      paddingBottom: 50,
    },

    back: {
      color: "#ee5a2b",
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 25,
    },

    eyebrow: {
      color: "#ee5a2b",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
    },

    title: {
      color: "#171614",
      fontSize: 30,
      fontWeight: "800",
      marginTop: 6,
      marginBottom: 10,
    },

    statusBadge: {
      alignSelf: "flex-start",
      backgroundColor:
        "#eee8e0",
      borderRadius: 20,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },

    statusText: {
      color: "#4c4640",
      fontSize: 10,
      fontWeight: "800",
    },

    date: {
      color: "#7e7770",
      fontSize: 11,
      marginTop: 10,
      marginBottom: 20,
    },

    card: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#e4ddd4",
      padding: 19,
      marginBottom: 16,
    },

    sectionTitle: {
      color: "#171614",
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 15,
    },

    itemRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: 15,
      marginBottom: 12,
    },

    itemLabel: {
      flex: 1,
      color: "#605a54",
      fontSize: 13,
    },

    itemAmount: {
      color: "#171614",
      fontSize: 13,
      fontWeight: "700",
    },

    separator: {
      height: 1,
      backgroundColor:
        "#e9e2d9",
      marginVertical: 10,
    },

    totalRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      paddingVertical: 5,
    },

    totalLabel: {
      color: "#746d66",
      fontSize: 12,
    },

    totalValue: {
      color: "#171614",
      fontSize: 12,
      fontWeight: "700",
    },

    ttcRow: {
      marginTop: 6,
    },

    ttcLabel: {
      color: "#171614",
      fontSize: 15,
      fontWeight: "800",
    },

    ttcValue: {
      color: "#ee5a2b",
      fontSize: 20,
      fontWeight: "800",
    },

    sendButton: {
      backgroundColor:
        "#ee5a2b",
      borderRadius: 13,
      minHeight: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 11,
    },

    sendText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },

    sentBox: {
      backgroundColor:
        "#eee8e0",
      borderRadius: 13,
      padding: 15,
      marginBottom: 11,
    },

    sentText: {
      color: "#5d5751",
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },

    pdfButton: {
      borderWidth: 1,
      borderColor: "#171614",
      borderRadius: 13,
      minHeight: 50,
      justifyContent: "center",
      alignItems: "center",
    },

    pdfText: {
      color: "#171614",
      fontSize: 13,
      fontWeight: "800",
    },

    pdfHelp: {
      color: "#827a73",
      fontSize: 10,
      lineHeight: 15,
      textAlign: "center",
      marginTop: 9,
    },

    centerState: {
      flex: 1,
      backgroundColor:
        "#f7f4ee",
      alignItems: "center",
      justifyContent: "center",
    },
  });
import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  getQuotes,
} from "../api";


const STATUS_LABELS = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CHANGE_REQUESTED:
    "Modification demandée",
};


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatMoney(value) {
  return (
    Number(value || 0)
      .toFixed(2)
      .replace(".", ",") +
    " €"
  );
}


export default function QuotesScreen({
  navigation,
}) {
  const [
    quotes,
    setQuotes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const loadQuotes =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const data =
            await getQuotes();

          setQuotes(data);
        } catch (error) {
          Alert.alert(
            "Devis",
            error?.message ||
              "Impossible de charger les devis."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [loadQuotes])
  );


  return (
    <View
      style={styles.screen}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text
            style={styles.back}
          >
            ← Accueil
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.eyebrow}
        >
          SUIVI COMMERCIAL
        </Text>

        <Text
          style={styles.title}
        >
          Devis
        </Text>

        <Text
          style={styles.subtitle}
        >
          Consultation, envoi
          et téléchargement PDF.
        </Text>
      </View>

      {loading ? (
        <View
          style={styles.centerState}
        >
          <ActivityIndicator
            size="large"
            color="#ee5a2b"
          />
        </View>
      ) : (
        <FlatList
          data={quotes}

          keyExtractor={(item) =>
            String(item.id)
          }

          contentContainerStyle={
            styles.list
          }

          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                loadQuotes(true)
              }
            />
          }

          renderItem={({ item }) => (
            <View
              style={styles.card}
            >
              <View
                style={styles.cardTop}
              >
                <View>
                  <Text
                    style={
                      styles.referenceLabel
                    }
                  >
                    RÉFÉRENCE
                  </Text>

                  <Text
                    style={
                      styles.reference
                    }
                  >
                    {item.reference ||
                      item.id}
                  </Text>
                </View>

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
                      item.status
                    ] ||
                      item.status}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.date}
              >
                Créé le{" "}
                {formatDate(
                  item.created_at
                )}
              </Text>

              <View
                style={styles.separator}
              />

              <View
                style={styles.amountRow}
              >
                <View>
                  <Text
                    style={
                      styles.amountLabel
                    }
                  >
                    TOTAL HT
                  </Text>

                  <Text
                    style={
                      styles.amountSecondary
                    }
                  >
                    {formatMoney(
                      item.total_ht
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.amountRight
                  }
                >
                  <Text
                    style={
                      styles.amountLabel
                    }
                  >
                    TOTAL TTC
                  </Text>

                  <Text
                    style={styles.amount}
                  >
                    {formatMoney(
                      item.total_ttc
                    )}
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.itemsCount
                }
              >
                {item.items?.length ||
                  0}{" "}
                prestation(s)
              </Text>

              <TouchableOpacity
                style={
                  styles.openButton
                }
                onPress={() =>
                  navigation.navigate(
                    "QuoteDetail",
                    {
                      quoteId:
                        item.id,
                    }
                  )
                }
              >
                <Text
                  style={
                    styles.openText
                  }
                >
                  Ouvrir le devis →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          ListEmptyComponent={
            <View
              style={
                styles.centerState
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                Aucun devis
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}


const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f7f4ee",
    },

    header: {
      paddingTop: 58,
      paddingHorizontal: 22,
      paddingBottom: 20,
    },

    back: {
      color: "#ee5a2b",
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 24,
    },

    eyebrow: {
      color: "#ee5a2b",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 7,
    },

    title: {
      color: "#171614",
      fontSize: 30,
      fontWeight: "800",
      marginBottom: 5,
    },

    subtitle: {
      color: "#766f68",
      fontSize: 13,
      lineHeight: 19,
    },

    list: {
      paddingHorizontal: 22,
      paddingBottom: 40,
      flexGrow: 1,
    },

    card: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#e4ddd4",
      padding: 19,
      marginBottom: 13,
    },

    cardTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    referenceLabel: {
      color: "#9a938c",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.3,
      marginBottom: 4,
    },

    reference: {
      color: "#171614",
      fontSize: 20,
      fontWeight: "800",
    },

    statusBadge: {
      backgroundColor:
        "#f1ece5",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      maxWidth: 150,
    },

    statusText: {
      color: "#4b4641",
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
    },

    date: {
      color: "#817a73",
      fontSize: 11,
      marginTop: 9,
    },

    separator: {
      height: 1,
      backgroundColor:
        "#eee8e0",
      marginVertical: 17,
    },

    amountRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
    },

    amountRight: {
      alignItems: "flex-end",
    },

    amountLabel: {
      color: "#9a938c",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 5,
    },

    amountSecondary: {
      color: "#625c56",
      fontSize: 15,
      fontWeight: "700",
    },

    amount: {
      color: "#171614",
      fontSize: 23,
      fontWeight: "800",
    },

    itemsCount: {
      color: "#777068",
      fontSize: 11,
      marginTop: 13,
      marginBottom: 16,
    },

    openButton: {
      backgroundColor:
        "#171614",
      borderRadius: 12,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
    },

    openText: {
      color: "#fffdf9",
      fontSize: 12,
      fontWeight: "800",
    },

    centerState: {
      flex: 1,
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      color: "#171614",
      fontSize: 18,
      fontWeight: "800",
    },
  });
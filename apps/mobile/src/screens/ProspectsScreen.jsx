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
  getProspects,
  updateProspectStatus,
} from "../api";


const STATUS_LABELS = {
  TO_CONTACT:
    "À traiter",

  CONTACTED:
    "Contactée",

  QUALIFIED:
    "Qualifiée",

  ARCHIVED:
    "Archivée",
};


const NEXT_STATUS = {
  TO_CONTACT: {
    value: "CONTACTED",

    label:
      "Marquer contactée",
  },

  CONTACTED: {
    value: "QUALIFIED",

    label:
      "Qualifier",
  },

  QUALIFIED: {
    value: "ARCHIVED",

    label:
      "Archiver",
  },
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


export default function ProspectsScreen({
  navigation,
}) {
  const [
    prospects,
    setProspects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);


  const loadProspects =
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
            await getProspects();

          setProspects(
            data
          );
        } catch (error) {
          Alert.alert(
            "Demandes",

            error?.message ||
              "Impossible de charger les demandes."
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      []
    );


  useFocusEffect(
    useCallback(() => {
      loadProspects();
    }, [loadProspects])
  );


  function confirmStatusChange(
    prospect
  ) {
    const next =
      NEXT_STATUS[
        prospect.status
      ];

    if (!next) {
      return;
    }

    Alert.alert(
      "Mettre à jour la demande",

      `${prospect.first_name} ${prospect.last_name}\n\n${next.label} ?`,

      [
        {
          text: "Annuler",

          style: "cancel",
        },

        {
          text: next.label,

          onPress:
            async () => {
              setUpdatingId(
                prospect.id
              );

              try {
                const updated =
                  await updateProspectStatus(
                    prospect.id,
                    next.value
                  );

                setProspects(
                  (current) =>
                    current.map(
                      (item) =>
                        item.id ===
                        prospect.id
                          ? updated
                          : item
                    )
                );
              } catch (error) {
                Alert.alert(
                  "Demandes",

                  error?.message ||
                    "Impossible de modifier le statut."
                );
              } finally {
                setUpdatingId(
                  null
                );
              }
            },
        },
      ]
    );
  }


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
          style={
            styles.eyebrow
          }
        >
          SUIVI COMMERCIAL
        </Text>

        <Text
          style={styles.title}
        >
          Demandes
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Suivi rapide des
          demandes entrantes.
        </Text>
      </View>

      {loading ? (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color="#ee5a2b"
          />

          <Text
            style={
              styles.stateText
            }
          >
            Chargement…
          </Text>
        </View>
      ) : (
        <FlatList
          data={prospects}

          keyExtractor={(
            item
          ) =>
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
                loadProspects(
                  true
                )
              }
            />
          }

          renderItem={({
            item,
          }) => {
            const next =
              NEXT_STATUS[
                item.status
              ];

            const updating =
              updatingId ===
              item.id;

            return (
              <View
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.cardTop
                  }
                >
                  <Text
                    style={
                      styles.date
                    }
                  >
                    {formatDate(
                      item.created_at
                    )}
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
                        item.status
                      ] ||
                        item.status}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.name
                  }
                >
                  {item.first_name}{" "}
                  {item.last_name}
                </Text>

                {item.company ? (
                  <Text
                    style={
                      styles.company
                    }
                  >
                    {item.company}
                  </Text>
                ) : null}

                <View
                  style={
                    styles.details
                  }
                >
                  <Text
                    style={
                      styles.detail
                    }
                  >
                    {item.email}
                  </Text>

                  {item.phone ? (
                    <Text
                      style={
                        styles.detail
                      }
                    >
                      {item.phone}
                    </Text>
                  ) : null}

                  {item.city ? (
                    <Text
                      style={
                        styles.detail
                      }
                    >
                      {item.city}
                    </Text>
                  ) : null}
                </View>

                {item.event_type ? (
                  <Text
                    style={
                      styles.eventType
                    }
                  >
                    Projet :{" "}
                    {item.event_type}
                  </Text>
                ) : null}

                {item.message ? (
                  <Text
                    numberOfLines={3}
                    style={
                      styles.message
                    }
                  >
                    {item.message}
                  </Text>
                ) : null}

                {next ? (
                  <TouchableOpacity
                    style={
                      styles.actionButton
                    }

                    disabled={
                      updating
                    }

                    onPress={() =>
                      confirmStatusChange(
                        item
                      )
                    }
                  >
                    {updating ? (
                      <ActivityIndicator
                        color="#fffdf9"
                      />
                    ) : (
                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {next.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={
                      styles.archivedText
                    }
                  >
                    Demande archivée
                  </Text>
                )}
              </View>
            );
          }}

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
                Aucune demande
              </Text>

              <Text
                style={
                  styles.stateText
                }
              >
                Rien à afficher
                pour le moment.
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

      alignItems: "center",

      marginBottom: 12,
    },

    date: {
      color: "#918981",

      fontSize: 11,
    },

    statusBadge: {
      backgroundColor:
        "#f1ece5",

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 20,
    },

    statusText: {
      color: "#4d4741",

      fontSize: 10,

      fontWeight: "800",
    },

    name: {
      color: "#171614",

      fontSize: 20,

      fontWeight: "800",

      marginBottom: 4,
    },

    company: {
      color: "#ee5a2b",

      fontSize: 12,

      fontWeight: "700",

      marginBottom: 12,
    },

    details: {
      marginTop: 8,

      marginBottom: 12,
    },

    detail: {
      color: "#69635d",

      fontSize: 12,

      lineHeight: 19,
    },

    eventType: {
      color: "#171614",

      fontSize: 12,

      fontWeight: "700",

      marginBottom: 9,
    },

    message: {
      color: "#777068",

      fontSize: 12,

      lineHeight: 18,

      marginBottom: 15,
    },

    actionButton: {
      backgroundColor:
        "#171614",

      borderRadius: 12,

      minHeight: 44,

      alignItems: "center",

      justifyContent:
        "center",

      paddingHorizontal: 14,
    },

    actionText: {
      color: "#fffdf9",

      fontSize: 12,

      fontWeight: "800",
    },

    archivedText: {
      color: "#8b847d",

      fontSize: 11,

      fontWeight: "700",
    },

    centerState: {
      flex: 1,

      minHeight: 240,

      alignItems: "center",

      justifyContent:
        "center",

      paddingHorizontal: 28,
    },

    stateText: {
      color: "#7d766f",

      fontSize: 13,

      textAlign: "center",

      marginTop: 10,
    },

    emptyTitle: {
      color: "#171614",

      fontSize: 18,

      fontWeight: "800",
    },
  });
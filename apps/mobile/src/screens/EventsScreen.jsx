import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getEvents,
} from "../api";

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  ACCEPTED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

function formatDate(value) {
  if (!value) {
    return "Date non définie";
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

export default function EventsScreen({
  user,
  onLogout,
}) {
  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadEvents =
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
            await getEvents();

          setEvents(data);
        } catch (error) {
          Alert.alert(
            "Événements",
            error?.message ||
              "Impossible de charger les événements."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const roleLabel =
    user?.is_superuser ||
    user?.role === "ADMIN"
      ? "Administrateur"
      : "Employé";

  return (
    <View
      style={styles.screen}
    >
      <View
        style={styles.header}
      >
        <View>
          <View
            style={
              styles.brandRow
            }
          >
            <View
              style={
                styles.brandDot
              }
            />

            <Text
              style={styles.brand}
            >
              Innov'Events
            </Text>
          </View>

          <Text
            style={styles.eyebrow}
          >
            ESPACE ÉQUIPE
          </Text>

          <Text
            style={styles.title}
          >
            Bonjour{" "}
            {user?.username || ""}
          </Text>

          <Text
            style={styles.role}
          >
            {roleLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={onLogout}
        >
          <Text
            style={
              styles.logoutText
            }
          >
            Quitter
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.sectionHeader}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Événements
        </Text>

        <Text
          style={styles.count}
        >
          {events.length}
        </Text>
      </View>

      {loading ? (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            color="#ee5a2b"
            size="large"
          />

          <Text
            style={
              styles.stateText
            }
          >
            Chargement des événements…
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
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
                loadEvents(true)
              }
            />
          }
          renderItem={({
            item,
          }) => (
            <View
              style={styles.card}
            >
              <View
                style={
                  styles.cardTop
                }
              >
                <Text
                  style={
                    styles.eventType
                  }
                >
                  {item.event_type ||
                    "ÉVÉNEMENT"}
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
                      item.status ||
                      "—"}
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.eventTitle
                }
              >
                {item.title}
              </Text>

              <Text
                style={
                  styles.eventMeta
                }
              >
                {item.city ||
                  "Lieu à définir"}
              </Text>

              <View
                style={
                  styles.separator
                }
              />

              <Text
                style={
                  styles.dateLabel
                }
              >
                DÉBUT
              </Text>

              <Text
                style={
                  styles.eventDate
                }
              >
                {formatDate(
                  item.start_at
                )}
              </Text>
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
                Aucun événement
              </Text>

              <Text
                style={
                  styles.stateText
                }
              >
                Aucun événement n'est
                disponible pour le
                moment.
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
      paddingBottom: 28,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
    },

    brandDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor:
        "#ee5a2b",
      marginRight: 9,
    },

    brand: {
      color: "#171614",
      fontSize: 17,
      fontWeight: "700",
    },

    eyebrow: {
      color: "#ee5a2b",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 8,
    },

    title: {
      color: "#171614",
      fontFamily:
        Platform.OS === "android"
          ? "serif"
          : "Georgia",
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "700",
    },

    role: {
      color: "#756f68",
      fontSize: 13,
      marginTop: 5,
    },

    logoutButton: {
      marginTop: 2,
      borderWidth: 1,
      borderColor:
        "#d8d1c8",
      borderRadius: 30,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor:
        "#fffdf9",
    },

    logoutText: {
      color: "#171614",
      fontSize: 12,
      fontWeight: "700",
    },

    sectionHeader: {
      paddingHorizontal: 22,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    sectionTitle: {
      color: "#171614",
      fontSize: 18,
      fontWeight: "800",
      marginRight: 9,
    },

    count: {
      minWidth: 25,
      height: 25,
      paddingHorizontal: 7,
      borderRadius: 13,
      backgroundColor:
        "#ee5a2b",
      color: "#fffdf9",
      textAlign: "center",
      lineHeight: 25,
      fontSize: 11,
      fontWeight: "800",
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
      padding: 19,
      marginBottom: 13,
      borderWidth: 1,
      borderColor:
        "#e5dfd6",
    },

    cardTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 13,
    },

    eventType: {
      color: "#8a837b",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
    },

    statusBadge: {
      backgroundColor:
        "#f1ece5",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    statusText: {
      color: "#4b4641",
      fontSize: 10,
      fontWeight: "700",
    },

    eventTitle: {
      color: "#171614",
      fontFamily:
        Platform.OS === "android"
          ? "serif"
          : "Georgia",
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "700",
      marginBottom: 7,
    },

    eventMeta: {
      color: "#716b64",
      fontSize: 13,
    },

    separator: {
      height: 1,
      backgroundColor:
        "#eee8e0",
      marginVertical: 16,
    },

    dateLabel: {
      color: "#a09a92",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.3,
      marginBottom: 4,
    },

    eventDate: {
      color: "#171614",
      fontSize: 13,
      fontWeight: "700",
    },

    centerState: {
      flex: 1,
      minHeight: 240,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyTitle: {
      color: "#171614",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 7,
    },

    stateText: {
      color: "#7b756e",
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      marginTop: 12,
    },
  });
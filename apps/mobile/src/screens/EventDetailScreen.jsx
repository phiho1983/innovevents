import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  completeEvent,
  createNote,
  getEvent,
  getNotes,
  startEvent,
  updateNote,
} from "../api";


const STATUS_LABELS = {
  DRAFT: "Brouillon",
  ACCEPTED: "Confirmé",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};


const TYPE_LABELS = {
  SEMINAR: "Séminaire",
  CONFERENCE: "Conférence",
  PARTY: "Soirée d'entreprise",
  OTHER: "Autre",
};


function formatDateTime(value) {
  if (!value) {
    return "Non défini";
  }

  return new Date(
    value
  ).toLocaleString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function DetailRow({
  label,
  value,
}) {
  return (
    <View
      style={styles.detailRow}
    >
      <Text
        style={styles.detailLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.detailValue}
      >
        {value || "—"}
      </Text>
    </View>
  );
}


export default function EventDetailScreen({
  route,
  navigation,
}) {
  const {
    eventId,
  } = route.params;

  const [
    event,
    setEvent,
  ] = useState(null);

  const [
    notes,
    setNotes,
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
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    noteSaving,
    setNoteSaving,
  ] = useState(false);

  const [
    noteText,
    setNoteText,
  ] = useState("");

  const [
    editingNoteId,
    setEditingNoteId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  const loadEvent =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const eventData =
            await getEvent(
              eventId
            );

          setEvent(
            eventData
          );

          if (
            eventData?.client
          ) {
            const allNotes =
              await getNotes();

            setNotes(
              allNotes.filter(
                (note) =>
                  Number(
                    note.client
                  ) ===
                  Number(
                    eventData.client
                  )
              )
            );
          } else {
            setNotes([]);
          }
        } catch (loadError) {
          setError(
            loadError?.message ||
              "Impossible de charger l'événement."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [eventId]
    );


  useEffect(() => {
    loadEvent();
  }, [loadEvent]);


  async function runTransition(
    transition
  ) {
    setActionLoading(true);

    try {
      if (
        transition === "start"
      ) {
        await startEvent(
          eventId
        );
      } else {
        await completeEvent(
          eventId
        );
      }

      await loadEvent(true);
    } catch (actionError) {
      Alert.alert(
        "Événement",
        actionError?.message ||
          "Impossible de modifier le statut."
      );
    } finally {
      setActionLoading(false);
    }
  }


  function confirmStart() {
    Alert.alert(
      "Démarrer l'événement",
      "Passer cet événement au statut « En cours » ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Démarrer",
          onPress: () =>
            runTransition(
              "start"
            ),
        },
      ]
    );
  }


  function confirmComplete() {
    Alert.alert(
      "Terminer l'événement",
      "Confirmer que cet événement est terminé ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Terminer",
          onPress: () =>
            runTransition(
              "complete"
            ),
        },
      ]
    );
  }


  async function saveNote() {
    const content =
      noteText.trim();

    if (!content) {
      return;
    }

    if (!event?.client) {
      Alert.alert(
        "Notes",
        "Cet événement n'est associé à aucun client."
      );

      return;
    }

    setNoteSaving(true);

    try {
      if (editingNoteId) {
        await updateNote(
          editingNoteId,
          content
        );
      } else {
        await createNote({
          clientId:
            event.client,
          content,
        });
      }

      setNoteText("");
      setEditingNoteId(
        null
      );

      await loadEvent(true);
    } catch (noteError) {
      Alert.alert(
        "Notes",
        noteError?.message ||
          "Impossible d'enregistrer la note."
      );
    } finally {
      setNoteSaving(false);
    }
  }


  function editNote(note) {
    setEditingNoteId(
      note.id
    );

    setNoteText(
      note.content || ""
    );
  }


  function cancelEdit() {
    setEditingNoteId(
      null
    );

    setNoteText("");
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

        <Text
          style={
            styles.stateText
          }
        >
          Chargement de l'événement…
        </Text>
      </View>
    );
  }


  if (
    error ||
    !event
  ) {
    return (
      <View
        style={
          styles.centerState
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Impossible d'afficher
          l'événement
        </Text>

        <Text
          style={
            styles.stateText
          }
        >
          {error ||
            "Événement introuvable."}
        </Text>

        <TouchableOpacity
          style={
            styles.retryButton
          }
          onPress={() =>
            loadEvent()
          }
        >
          <Text
            style={
              styles.retryText
            }
          >
            Réessayer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text
            style={
              styles.backLink
            }
          >
            ← Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }


  const canStart =
    event.client &&
    event.status === "ACCEPTED";

  const canComplete =
    event.client &&
    event.status ===
      "IN_PROGRESS";


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }
          onRefresh={() =>
            loadEvent(true)
          }
        />
      }
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text
          style={styles.backText}
        >
          ← Événements
        </Text>
      </TouchableOpacity>

      <Text
        style={styles.eyebrow}
      >
        FICHE ÉVÉNEMENT
      </Text>

      <Text
        style={styles.title}
      >
        {event.title}
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
            event.status
          ] ||
            event.status}
        </Text>
      </View>

      <View
        style={styles.card}
      >
        <DetailRow
          label="TYPE"
          value={
            TYPE_LABELS[
              event.event_type
            ] ||
            event.event_type
          }
        />

        <DetailRow
          label="VILLE"
          value={event.city}
        />

        <DetailRow
          label="DÉBUT"
          value={
            formatDateTime(
              event.start_at
            )
          }
        />

        <DetailRow
          label="FIN"
          value={
            formatDateTime(
              event.end_at
            )
          }
        />

        <DetailRow
          label="CAPACITÉ"
          value={
            event.capacity != null
              ? String(
                  event.capacity
                )
              : "—"
          }
        />

        <DetailRow
          label="PLACES RESTANTES"
          value={
            event.remaining_capacity !=
            null
              ? String(
                  event.remaining_capacity
                )
              : "—"
          }
        />

        {event.theme ? (
          <DetailRow
            label="THÈME"
            value={event.theme}
          />
        ) : null}

        {event.client ? (
          <DetailRow
            label="CLIENT"
            value={`Client #${event.client}`}
          />
        ) : null}
      </View>

      {event.description ? (
        <View
          style={
            styles.descriptionCard
          }
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            DESCRIPTION
          </Text>

          <Text
            style={
              styles.description
            }
          >
            {event.description}
          </Text>
        </View>
      ) : null}

      {canStart ? (
        <TouchableOpacity
          style={
            styles.primaryButton
          }
          disabled={
            actionLoading
          }
          onPress={
            confirmStart
          }
        >
          {actionLoading ? (
            <ActivityIndicator
              color="#fffdf9"
            />
          ) : (
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Démarrer l'événement
            </Text>
          )}
        </TouchableOpacity>
      ) : null}

      {canComplete ? (
        <TouchableOpacity
          style={
            styles.primaryButton
          }
          disabled={
            actionLoading
          }
          onPress={
            confirmComplete
          }
        >
          {actionLoading ? (
            <ActivityIndicator
              color="#fffdf9"
            />
          ) : (
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Terminer l'événement
            </Text>
          )}
        </TouchableOpacity>
      ) : null}

      {event.status === "DONE" ? (
        <View
          style={
            styles.completedBox
          }
        >
          <Text
            style={
              styles.completedText
            }
          >
            ✓ Événement terminé
          </Text>
        </View>
      ) : null}

      {event.client ? (
        <View
          style={
            styles.notesSection
          }
        >
          <Text
            style={
              styles.notesTitle
            }
          >
            Notes internes
          </Text>

          <Text
            style={
              styles.notesSubtitle
            }
          >
            Notes liées au client
            de cet événement.
          </Text>

          <View
            style={
              styles.noteEditor
            }
          >
            <TextInput
              value={noteText}
              onChangeText={
                setNoteText
              }
              multiline
              placeholder={
                editingNoteId
                  ? "Modifier la note…"
                  : "Ajouter une note interne…"
              }
              placeholderTextColor="#9a938b"
              style={
                styles.noteInput
              }
              editable={
                !noteSaving
              }
            />

            <TouchableOpacity
              style={
                styles.noteSaveButton
              }
              onPress={
                saveNote
              }
              disabled={
                noteSaving ||
                !noteText.trim()
              }
            >
              {noteSaving ? (
                <ActivityIndicator
                  color="#fffdf9"
                />
              ) : (
                <Text
                  style={
                    styles.noteSaveText
                  }
                >
                  {editingNoteId
                    ? "Enregistrer la modification"
                    : "Ajouter la note"}
                </Text>
              )}
            </TouchableOpacity>

            {editingNoteId ? (
              <TouchableOpacity
                onPress={
                  cancelEdit
                }
                disabled={
                  noteSaving
                }
              >
                <Text
                  style={
                    styles.cancelEditText
                  }
                >
                  Annuler la modification
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {notes.length === 0 ? (
            <Text
              style={
                styles.emptyNotes
              }
            >
              Aucune note interne
              pour ce client.
            </Text>
          ) : (
            notes.map(
              (note) => (
                <View
                  key={
                    note.id
                  }
                  style={
                    styles.noteCard
                  }
                >
                  <Text
                    style={
                      styles.noteContent
                    }
                  >
                    {note.content}
                  </Text>

                  <View
                    style={
                      styles.noteFooter
                    }
                  >
                    <Text
                      style={
                        styles.noteDate
                      }
                    >
                      {formatDateTime(
                        note.created_at
                      )}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        editNote(
                          note
                        )
                      }
                    >
                      <Text
                        style={
                          styles.editNoteText
                        }
                      >
                        Modifier
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )
          )}
        </View>
      ) : null}
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
      paddingTop: 56,
      paddingHorizontal: 22,
      paddingBottom: 50,
    },

    backButton: {
      alignSelf: "flex-start",
      marginBottom: 30,
    },

    backText: {
      color: "#716b64",
      fontSize: 13,
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
      fontSize: 31,
      lineHeight: 37,
      fontWeight: "700",
      marginBottom: 14,
    },

    statusBadge: {
      alignSelf: "flex-start",
      backgroundColor:
        "#eee8e0",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginBottom: 24,
    },

    statusText: {
      color: "#4b4641",
      fontSize: 11,
      fontWeight: "800",
    },

    card: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 18,
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor:
        "#e5dfd6",
      marginBottom: 15,
    },

    detailRow: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee8e0",
    },

    detailLabel: {
      color: "#9a938b",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 5,
    },

    detailValue: {
      color: "#171614",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },

    descriptionCard: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor:
        "#e5dfd6",
      marginBottom: 15,
    },

    sectionLabel: {
      color: "#9a938b",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 9,
    },

    description: {
      color: "#4b4641",
      fontSize: 14,
      lineHeight: 22,
    },

    primaryButton: {
      minHeight: 52,
      borderRadius: 14,
      backgroundColor:
        "#171614",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 18,
      marginTop: 4,
    },

    primaryButtonText: {
      color: "#fffdf9",
      fontSize: 14,
      fontWeight: "800",
    },

    completedBox: {
      borderRadius: 14,
      backgroundColor:
        "#ece8e1",
      padding: 16,
      alignItems: "center",
      marginTop: 4,
    },

    completedText: {
      color: "#4f4a44",
      fontSize: 13,
      fontWeight: "800",
    },

    notesSection: {
      marginTop: 30,
    },

    notesTitle: {
      color: "#171614",
      fontFamily:
        Platform.OS === "android"
          ? "serif"
          : "Georgia",
      fontSize: 24,
      fontWeight: "700",
    },

    notesSubtitle: {
      color: "#756f68",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
      marginBottom: 14,
    },

    noteEditor: {
      backgroundColor:
        "#fffdf9",
      borderWidth: 1,
      borderColor:
        "#e5dfd6",
      borderRadius: 18,
      padding: 15,
      marginBottom: 14,
    },

    noteInput: {
      minHeight: 90,
      color: "#171614",
      fontSize: 14,
      lineHeight: 21,
      textAlignVertical:
        "top",
      padding: 0,
    },

    noteSaveButton: {
      minHeight: 45,
      backgroundColor:
        "#171614",
      borderRadius: 12,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 13,
    },

    noteSaveText: {
      color: "#fffdf9",
      fontSize: 13,
      fontWeight: "800",
    },

    cancelEditText: {
      color: "#ee5a2b",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 12,
    },

    noteCard: {
      backgroundColor:
        "#fffdf9",
      borderWidth: 1,
      borderColor:
        "#e5dfd6",
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },

    noteContent: {
      color: "#403c38",
      fontSize: 14,
      lineHeight: 21,
    },

    noteFooter: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 13,
    },

    noteDate: {
      color: "#999188",
      fontSize: 10,
    },

    editNoteText: {
      color: "#ee5a2b",
      fontSize: 11,
      fontWeight: "800",
    },

    emptyNotes: {
      color: "#8a837b",
      fontSize: 13,
      textAlign: "center",
      paddingVertical: 20,
    },

    centerState: {
      flex: 1,
      backgroundColor:
        "#f7f4ee",
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 28,
    },

    stateText: {
      color: "#7b756e",
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      marginTop: 12,
    },

    errorTitle: {
      color: "#171614",
      fontSize: 19,
      fontWeight: "800",
      textAlign: "center",
    },

    retryButton: {
      backgroundColor:
        "#171614",
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 20,
    },

    retryText: {
      color: "#fffdf9",
      fontWeight: "800",
    },

    backLink: {
      color: "#ee5a2b",
      fontSize: 13,
      fontWeight: "700",
      marginTop: 22,
    },
  });
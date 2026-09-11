import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  createNote,
  getNotes,
  updateNote,
} from "../api";


function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


export default function NotesScreen({
  navigation,
}) {
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
    noteText,
    setNoteText,
  ] = useState("");

  const [
    editingNoteId,
    setEditingNoteId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);


  const loadNotes =
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
            await getNotes();

          setNotes(data);
        } catch (error) {
          Alert.alert(
            "Notes",
            error?.message ||
              "Impossible de charger les notes."
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
      loadNotes();
    }, [loadNotes])
  );


  function startEdit(note) {
    setEditingNoteId(
      note.id
    );

    setNoteText(
      note.content || ""
    );
  }


  function cancelEdit() {
    setEditingNoteId(null);
    setNoteText("");
  }


  async function saveNote() {
    const content =
      noteText.trim();

    if (!content) {
      return;
    }

    setSaving(true);

    try {
      if (editingNoteId) {
        await updateNote(
          editingNoteId,
          content
        );
      } else {
        await createNote({
          content,
        });
      }

      setEditingNoteId(null);
      setNoteText("");

      await loadNotes(true);
    } catch (error) {
      Alert.alert(
        "Notes",
        error?.message ||
          "Impossible d'enregistrer la note."
      );
    } finally {
      setSaving(false);
    }
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
            loadNotes(true)
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
          ← Accueil
        </Text>
      </TouchableOpacity>

      <Text
        style={styles.eyebrow}
      >
        COLLABORATION
      </Text>

      <Text
        style={styles.title}
      >
        Notes internes
      </Text>

      <Text
        style={styles.subtitle}
      >
        Pense-bête partagé entre
        administrateurs et employés.
      </Text>

      <View
        style={styles.editorCard}
      >
        <Text
          style={styles.editorTitle}
        >
          {editingNoteId
            ? "Modifier la note"
            : "Nouvelle note"}
        </Text>

        <TextInput
          value={noteText}
          onChangeText={
            setNoteText
          }
          multiline
          placeholder={
            editingNoteId
              ? "Modifier la note…"
              : "Écrire une note…"
          }
          placeholderTextColor="#938b83"
          style={styles.input}
          editable={!saving}
        />

        <TouchableOpacity
          style={styles.saveButton}
          disabled={
            saving ||
            !noteText.trim()
          }
          onPress={saveNote}
        >
          {saving ? (
            <ActivityIndicator
              color="#fff"
            />
          ) : (
            <Text
              style={styles.saveText}
            >
              {editingNoteId
                ? "Enregistrer"
                : "Ajouter la note"}
            </Text>
          )}
        </TouchableOpacity>

        {editingNoteId ? (
          <TouchableOpacity
            onPress={cancelEdit}
          >
            <Text
              style={styles.cancelText}
            >
              Annuler la modification
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text
        style={styles.sectionTitle}
      >
        Notes récentes
      </Text>

      {loading ? (
        <View
          style={styles.loadingBox}
        >
          <ActivityIndicator
            size="large"
            color="#ee5a2b"
          />
        </View>
      ) : notes.length === 0 ? (
        <Text
          style={styles.empty}
        >
          Aucune note interne.
        </Text>
      ) : (
        notes.map(
          (note) => (
            <View
              key={note.id}
              style={styles.noteCard}
            >
              <View
                style={styles.noteTop}
              >
                <Text
                  style={styles.author}
                >
                  {note.author_name ||
                    "Équipe"}
                </Text>

                <Text
                  style={styles.noteDate}
                >
                  {formatDateTime(
                    note.created_at
                  )}
                </Text>
              </View>

              <Text
                style={styles.noteContent}
              >
                {note.content}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  startEdit(note)
                }
              >
                <Text
                  style={styles.edit}
                >
                  Modifier
                </Text>
              </TouchableOpacity>
            </View>
          )
        )
      )}
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
    },

    subtitle: {
      color: "#756e67",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 6,
      marginBottom: 22,
    },

    editorCard: {
      backgroundColor:
        "#171614",
      borderRadius: 18,
      padding: 18,
      marginBottom: 27,
    },

    editorTitle: {
      color: "#fffdf9",
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 13,
    },

    input: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 12,
      minHeight: 110,
      padding: 13,
      color: "#171614",
      fontSize: 14,
      textAlignVertical: "top",
      marginBottom: 11,
    },

    saveButton: {
      backgroundColor:
        "#ee5a2b",
      minHeight: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    saveText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "800",
    },

    cancelText: {
      color: "#d7cfc7",
      fontSize: 11,
      textAlign: "center",
      marginTop: 12,
    },

    sectionTitle: {
      color: "#171614",
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 13,
    },

    loadingBox: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
    },

    empty: {
      color: "#777068",
      fontSize: 13,
    },

    noteCard: {
      backgroundColor:
        "#fffdf9",
      borderWidth: 1,
      borderColor:
        "#e4ddd4",
      borderRadius: 16,
      padding: 17,
      marginBottom: 11,
    },

    noteTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 11,
    },

    author: {
      color: "#ee5a2b",
      fontSize: 11,
      fontWeight: "800",
    },

    noteDate: {
      color: "#99918a",
      fontSize: 9,
    },

    noteContent: {
      color: "#302d2a",
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 13,
    },

    edit: {
      color: "#171614",
      fontSize: 11,
      fontWeight: "800",
    },
  });
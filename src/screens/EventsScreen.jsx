import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEvents } from "../api";

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem("access_token").then((tok) => {
      if (!tok) return;
      getEvents(tok)
        .then((d) => setEvents(d.results || d))
        .catch((e) => {
          console.log("getEvents error:", e);
          Alert.alert("Erreur", "Impossible de charger les événements.");
        });
    });
  }, []);

  return (
    <View style={s.container}>
      <FlatList
        data={events}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate("EventDetail", { event: item })}
          >
            <Text style={s.name}>{item.title}</Text>
            <Text style={s.info}>
              {item.city} — {new Date(item.start_at).toLocaleDateString("fr-FR")}
            </Text>
            {item.end_at && (
              <Text style={s.info}>
                Fin : {new Date(item.end_at).toLocaleDateString("fr-FR")}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>Aucun événement à venir.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  card: { backgroundColor: "#fff", margin: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#eee" },
  name: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  info: { fontSize: 13, color: "#666" },
  empty: { textAlign: "center", marginTop: 40, color: "#aaa" },
});
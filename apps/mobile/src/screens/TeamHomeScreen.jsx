import React from "react";

import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


function MenuCard({
  eyebrow,
  title,
  description,
  action,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={onPress}
    >
      <Text
        style={
          styles.cardEyebrow
        }
      >
        {eyebrow}
      </Text>

      <Text
        style={
          styles.cardTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.cardDescription
        }
      >
        {description}
      </Text>

      <Text
        style={
          styles.cardAction
        }
      >
        {action} →
      </Text>
    </TouchableOpacity>
  );
}


export default function TeamHomeScreen({
  navigation,
  user,
  onLogout,
}) {
  const isAdmin =
    user?.is_superuser ||
    user?.role === "ADMIN";

  const roleLabel =
    isAdmin
      ? "Administrateur"
      : "Employé";


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
    >
      <View
        style={styles.topBar}
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
        style={
          styles.introCard
        }
      >
        <Text
          style={
            styles.introEyebrow
          }
        >
          OUTIL TERRAIN
        </Text>

        <Text
          style={
            styles.introTitle
          }
        >
          L'essentiel,
          directement en mobilité.
        </Text>

        <Text
          style={
            styles.introText
          }
        >
          Suivez les demandes,
          envoyez les devis et
          pilotez les événements
          sans ouvrir le back-office
          complet.
        </Text>
      </View>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Accès rapides
      </Text>

      <MenuCard
        eyebrow="COMMERCIAL"
        title="Demandes"
        description={
          "Consulter les demandes entrantes et faire avancer leur traitement."
        }
        action="Ouvrir les demandes"
        onPress={() =>
          navigation.navigate(
            "Prospects"
          )
        }
      />

      <MenuCard
        eyebrow="COMMERCIAL"
        title="Devis"
        description={
          "Consulter les montants et envoyer un devis brouillon au client."
        }
        action="Ouvrir les devis"
        onPress={() =>
          navigation.navigate(
            "Quotes"
          )
        }
      />

      <MenuCard
        eyebrow="COLLABORATION"
        title="Notes internes"
        description={
          "Consulter, ajouter et modifier les notes partagées par l'équipe."
        }
        action="Ouvrir les notes"
        onPress={() =>
          navigation.navigate(
            "Notes"
          )
        }
      />

      <MenuCard
        eyebrow="TERRAIN"
        title="Événements"
        description={
          "Voir les événements, suivre leur statut et gérer les notes internes."
        }
        action="Ouvrir les événements"
        onPress={() =>
          navigation.navigate(
            "Events"
          )
        }
      />

      <View
        style={
          styles.infoBox
        }
      >
        <Text
          style={
            styles.infoTitle
          }
        >
          Application mobile équipe
        </Text>

        <Text
          style={
            styles.infoText
          }
        >
          Les opérations
          d'administration avancée,
          de suppression et le CMS
          restent volontairement
          dans l'application web.
        </Text>
      </View>
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

      paddingBottom: 44,
    },

    topBar: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      alignItems:
        "flex-start",

      marginBottom: 28,
    },

    brandRow: {
      flexDirection: "row",

      alignItems: "center",

      marginBottom: 24,
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

      marginBottom: 7,
    },

    title: {
      color: "#171614",

      fontFamily:
        Platform.OS ===
        "android"
          ? "serif"
          : "Georgia",

      fontSize: 30,

      lineHeight: 36,

      fontWeight: "700",
    },

    role: {
      color: "#756f68",

      fontSize: 13,

      marginTop: 5,
    },

    logoutButton: {
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

    introCard: {
      backgroundColor:
        "#171614",

      borderRadius: 22,

      padding: 24,

      marginBottom: 30,
    },

    introEyebrow: {
      color: "#ee5a2b",

      fontSize: 10,

      fontWeight: "800",

      letterSpacing: 1.5,

      marginBottom: 11,
    },

    introTitle: {
      color: "#fffdf9",

      fontFamily:
        Platform.OS ===
        "android"
          ? "serif"
          : "Georgia",

      fontSize: 25,

      lineHeight: 31,

      fontWeight: "700",

      marginBottom: 12,
    },

    introText: {
      color: "#c9c3bb",

      fontSize: 13,

      lineHeight: 20,
    },

    sectionTitle: {
      color: "#171614",

      fontSize: 18,

      fontWeight: "800",

      marginBottom: 14,
    },

    card: {
      backgroundColor:
        "#fffdf9",

      borderWidth: 1,

      borderColor:
        "#e4ddd4",

      borderRadius: 18,

      padding: 20,

      marginBottom: 13,
    },

    cardEyebrow: {
      color: "#ee5a2b",

      fontSize: 9,

      fontWeight: "800",

      letterSpacing: 1.4,

      marginBottom: 8,
    },

    cardTitle: {
      color: "#171614",

      fontFamily:
        Platform.OS ===
        "android"
          ? "serif"
          : "Georgia",

      fontSize: 22,

      fontWeight: "700",

      marginBottom: 8,
    },

    cardDescription: {
      color: "#716b64",

      fontSize: 13,

      lineHeight: 19,

      marginBottom: 16,
    },

    cardAction: {
      color: "#ee5a2b",

      fontSize: 12,

      fontWeight: "800",
    },

    infoBox: {
      borderTopWidth: 1,

      borderColor:
        "#ddd6cd",

      marginTop: 18,

      paddingTop: 20,
    },

    infoTitle: {
      color: "#171614",

      fontSize: 13,

      fontWeight: "800",

      marginBottom: 6,
    },

    infoText: {
      color: "#7c756e",

      fontSize: 12,

      lineHeight: 18,
    },
  });
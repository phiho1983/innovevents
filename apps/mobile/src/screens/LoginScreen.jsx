import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  login,
} from "../api";

export default function LoginScreen({
  navigation,
}) {
  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleLogin() {
    const cleanUsername =
      username.trim();

    if (
      !cleanUsername ||
      !password
    ) {
      Alert.alert(
        "Connexion",
        "Renseignez votre identifiant et votre mot de passe."
      );

      return;
    }

    setLoading(true);

    try {
      const data =
        await login(
          cleanUsername,
          password
        );

      if (
        !data?.requires_2fa
      ) {
        throw new Error(
          "La vérification en deux étapes n'a pas été demandée."
        );
      }

      navigation.navigate(
        "TwoFactor",
        {
          username:
            data.username ||
            cleanUsername,
        }
      );
    } catch (error) {
      Alert.alert(
        "Connexion impossible",
        error?.message ||
          "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.brandRow}
        >
          <View
            style={styles.brandDot}
          />

          <Text
            style={styles.brand}
          >
            Innov'Events
          </Text>
        </View>

        <View
          style={styles.intro}
        >
          <Text
            style={styles.eyebrow}
          >
            ESPACE ÉQUIPE
          </Text>

          <Text
            style={styles.title}
          >
            Pilotez vos événements,
            où que vous soyez.
          </Text>

          <Text
            style={styles.subtitle}
          >
            Application réservée aux
            administrateurs et aux
            collaborateurs Innov'Events.
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={styles.cardTitle}
          >
            Connexion
          </Text>

          <Text
            style={styles.label}
          >
            Identifiant
          </Text>

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Votre identifiant"
            placeholderTextColor="#8e8981"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text
            style={styles.label}
          >
            Mot de passe
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Votre mot de passe"
            placeholderTextColor="#8e8981"
            secureTextEntry
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={
              handleLogin
            }
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator
                color="#fffdf9"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Continuer
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.securityRow
            }
          >
            <View
              style={
                styles.securityDot
              }
            />

            <Text
              style={
                styles.securityText
              }
            >
              Connexion sécurisée par
              authentification à deux
              facteurs
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 64,
      paddingBottom: 40,
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 54,
    },

    brandDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#ee5a2b",
      marginRight: 10,
    },

    brand: {
      color: "#171614",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.4,
    },

    intro: {
      marginBottom: 32,
    },

    eyebrow: {
      color: "#ee5a2b",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.8,
      marginBottom: 14,
    },

    title: {
      color: "#171614",
      fontFamily:
        Platform.OS === "android"
          ? "serif"
          : "Georgia",
      fontSize: 38,
      lineHeight: 43,
      fontWeight: "700",
      letterSpacing: -1.1,
      marginBottom: 16,
    },

    subtitle: {
      color: "#68635d",
      fontSize: 15,
      lineHeight: 23,
      maxWidth: 330,
    },

    card: {
      backgroundColor:
        "#fffdf9",
      borderRadius: 22,
      padding: 22,
      borderWidth: 1,
      borderColor:
        "#e6e0d7",
    },

    cardTitle: {
      color: "#171614",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 24,
    },

    label: {
      color: "#3a3733",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
    },

    input: {
      height: 54,
      borderWidth: 1,
      borderColor:
        "#dcd5cc",
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor:
        "#fffdf9",
      color: "#171614",
      fontSize: 15,
      marginBottom: 18,
    },

    button: {
      height: 56,
      borderRadius: 12,
      backgroundColor:
        "#171614",
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 4,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    buttonText: {
      color: "#fffdf9",
      fontSize: 15,
      fontWeight: "700",
    },

    securityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 18,
      paddingHorizontal: 10,
    },

    securityDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#ee5a2b",
      marginRight: 8,
    },

    securityText: {
      flex: 1,
      color: "#7a746d",
      fontSize: 11,
      lineHeight: 16,
    },
  });
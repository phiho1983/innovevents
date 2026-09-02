import React, {
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getCurrentUser,
  logout,
  verifyLogin2FA,
} from "../api";

function isTeamUser(user) {
  return Boolean(
    user &&
      (
        user.is_superuser ||
        user.role === "ADMIN" ||
        user.role === "EMPLOYEE"
      )
  );
}

export default function TwoFactorScreen({
  route,
  navigation,
  onAuthenticated,
}) {
  const username =
    route.params?.username || "";

  const [
    code,
    setCode,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function handleVerify() {
    const cleanCode =
      code.trim();

    if (!cleanCode) {
      Alert.alert(
        "Code requis",
        "Saisissez le code reçu par e-mail."
      );

      return;
    }

    setLoading(true);

    try {
      await verifyLogin2FA(
        username,
        cleanCode
      );

      const user =
        await getCurrentUser();

      if (!isTeamUser(user)) {
        await logout();

        Alert.alert(
          "Accès refusé",
          "Cette application est réservée aux administrateurs et aux employés Innov'Events."
        );

        navigation.goBack();

        return;
      }

      onAuthenticated(user);
    } catch (error) {
      await logout();

      Alert.alert(
        "Vérification impossible",
        error?.message ||
          "Code invalide ou expiré."
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
      <View
        style={styles.content}
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

        <Text
          style={styles.eyebrow}
        >
          SÉCURITÉ
        </Text>

        <Text
          style={styles.title}
        >
          Vérifiez votre identité.
        </Text>

        <Text
          style={styles.subtitle}
        >
          Un code de connexion a été
          envoyé par e-mail pour le
          compte{" "}
          <Text
            style={
              styles.username
            }
          >
            {username}
          </Text>
          .
        </Text>

        <View
          style={styles.card}
        >
          <Text
            style={styles.label}
          >
            Code de vérification
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(value) =>
              setCode(
                value.replace(
                  /[^0-9]/g,
                  ""
                )
              )
            }
            placeholder="123456"
            placeholderTextColor="#b1aaa0"
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            textAlign="center"
            returnKeyType="done"
            onSubmitEditing={
              handleVerify
            }
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading}
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
                Vérifier le code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            disabled={loading}
            style={styles.backButton}
          >
            <Text
              style={
                styles.backText
              }
            >
              Modifier mes identifiants
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
      flex: 1,
      justifyContent:
        "center",
      paddingHorizontal: 24,
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 44,
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
    },

    eyebrow: {
      color: "#ee5a2b",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.8,
      marginBottom: 12,
    },

    title: {
      color: "#171614",
      fontFamily:
        Platform.OS === "android"
          ? "serif"
          : "Georgia",
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "700",
      letterSpacing: -1,
      marginBottom: 14,
    },

    subtitle: {
      color: "#68635d",
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 30,
    },

    username: {
      color: "#171614",
      fontWeight: "700",
    },

    card: {
      backgroundColor:
        "#fffdf9",
      borderWidth: 1,
      borderColor:
        "#e6e0d7",
      borderRadius: 22,
      padding: 22,
    },

    label: {
      color: "#3a3733",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 10,
    },

    codeInput: {
      height: 66,
      borderWidth: 1,
      borderColor:
        "#dcd5cc",
      borderRadius: 12,
      backgroundColor:
        "#fffdf9",
      color: "#171614",
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: 10,
      paddingLeft: 20,
      marginBottom: 18,
    },

    button: {
      height: 56,
      borderRadius: 12,
      backgroundColor:
        "#ee5a2b",
      alignItems: "center",
      justifyContent:
        "center",
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    buttonText: {
      color: "#fffdf9",
      fontSize: 15,
      fontWeight: "800",
    },

    backButton: {
      alignItems: "center",
      paddingTop: 18,
    },

    backText: {
      color: "#69635c",
      fontSize: 13,
      fontWeight: "600",
    },
  });
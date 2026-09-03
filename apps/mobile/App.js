import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createStackNavigator,
} from "@react-navigation/stack";

import LoginScreen from "./src/screens/LoginScreen";
import TwoFactorScreen from "./src/screens/TwoFactorScreen";
import EventsScreen from "./src/screens/EventsScreen";
import EventDetailScreen from "./src/screens/EventDetailScreen";

import {
  getCurrentUser,
  logout,
} from "./src/api";

const Stack =
  createStackNavigator();


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


export default function App() {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    booting,
    setBooting,
  ] = useState(true);


  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser =
          await getCurrentUser();

        if (
          isTeamUser(
            currentUser
          )
        ) {
          setUser(
            currentUser
          );
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setBooting(false);
      }
    }

    restoreSession();
  }, []);


  async function handleLogout() {
    await logout();
    setUser(null);
  }


  if (booting) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#ee5a2b"
        />
      </View>
    );
  }


  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor:
              "#f7f4ee",
          },
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Events"
            >
              {(props) => (
                <EventsScreen
                  {...props}
                  user={user}
                  onLogout={
                    handleLogout
                  }
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="EventDetail"
              component={
                EventDetailScreen
              }
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={
                LoginScreen
              }
            />

            <Stack.Screen
              name="TwoFactor"
            >
              {(props) => (
                <TwoFactorScreen
                  {...props}
                  onAuthenticated={
                    setUser
                  }
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


const styles =
  StyleSheet.create({
    loadingScreen: {
      flex: 1,
      backgroundColor:
        "#f7f4ee",
      alignItems: "center",
      justifyContent:
        "center",
    },
  });
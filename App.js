import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./src/screens/LoginScreen";
import EventsScreen from "./src/screens/EventsScreen";
import EventDetailScreen from "./src/screens/EventDetailScreen";
import ClientScreen from "./src/screens/ClientScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Innov'Events" }}
        />
        <Stack.Screen
          name="Events"
          component={EventsScreen}
          options={{ title: "Événements" }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: "Fiche événement" }}
        />
        <Stack.Screen
          name="Client"
          component={ClientScreen}
          options={{ title: "Fiche client" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { PaperProvider, Text } from "react-native-paper";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { paperTheme, navTheme, colors, gradients, type } from "./src/theme/theme";
import { AppProvider, useApp } from "./src/context/AppContext";
import DashboardScreen from "./src/screens/DashboardScreen";
import CheckScreen from "./src/screens/CheckScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import AlertScreen from "./src/screens/AlertScreen";
import ExplanationScreen from "./src/screens/ExplanationScreen";
import LowRiskResultScreen from "./src/screens/LowRiskResultScreen";
import BreakScreen from "./src/screens/BreakScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import TabBar from "./src/components/TabBar";
import * as Notifications from "expo-notifications";
// Imported for its side effect: defines the background task at startup,
// which the OS requires before it can run the task with the app closed.
import "./src/notifications/backgroundTask";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Check" component={CheckScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
    </Tab.Navigator>
  );
}

function Splash({ fontsReady }) {
  return (
    <LinearGradient colors={gradients.primary} style={styles.splash}>
      <MaterialCommunityIcons name="leaf" size={48} color="#fff" />
      {/* The brand font may not be loaded yet, so only use it once it is. */}
      <Text style={[styles.splashText, !fontsReady && { fontFamily: undefined, fontWeight: "800" }]}>EXAI</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
    </LinearGradient>
  );
}

// Opens the right screen when the user taps a notification (or its
// "Check in" button), including when the tap is what launched the app.
function NotificationRouter({ navReady }) {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!navReady || !response || !navigationRef.isReady()) return;
    if (response.actionIdentifier === "im-okay") return;
    const screen = response.notification.request.content.data?.screen;
    if (screen === "Break") navigationRef.navigate("Break");
    else if (screen === "Check" || screen === "Home") navigationRef.navigate("Main", { screen });
  }, [response, navReady]);

  return null;
}

function Root({ fontsReady }) {
  const { ready, onboarded } = useApp();
  const [navReady, setNavReady] = useState(false);
  if (!ready || !fontsReady) return <Splash fontsReady={fontsReady} />;

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef} onReady={() => setNavReady(true)}>
      {Platform.OS !== "web" && onboarded ? <NotificationRouter navReady={navReady} /> : null}
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        {!onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Alert" component={AlertScreen} options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="LowRiskResult" component={LowRiskResultScreen} options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="Explanation" component={ExplanationScreen} />
            <Stack.Screen name="Break" component={BreakScreen} options={{ animation: "fade", gestureEnabled: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // If a font fails to load we still start; text falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AppProvider>
          <StatusBar style="light" />
          <View style={styles.root}>
            <Root fontsReady={fontsLoaded || !!fontError} />
          </View>
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashText: { ...type.h1, color: "#fff", letterSpacing: 4, marginTop: 8 },
});

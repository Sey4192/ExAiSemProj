import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius } from "../theme/theme";
import { tap } from "../utils/haptics";

const ICONS = {
  Home: ["home-variant", "home-variant-outline"],
  Check: ["radar", "radar"],
  History: ["clock-time-four", "clock-time-four-outline"],
  Insights: ["chart-box", "chart-box-outline"],
};

// Floating, frosted tab bar. The active tab grows into a tinted pill with
// its label; inactive tabs show only their icon, keeping the bar calm.
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        {state.routes.map((route, i) => (
          <TabButton
            key={route.key}
            name={route.name}
            focused={state.index === i}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (state.index !== i && !event.defaultPrevented) {
                tap();
                navigation.navigate(route.name);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({ name, focused, onPress }) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: focused ? 1 : 0, useNativeDriver: false, friction: 9, tension: 80 }).start();
  }, [focused, anim]);

  const [activeIcon, idleIcon] = ICONS[name] || ["circle", "circle-outline"];

  return (
    <Animated.View style={{ flex: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }), height: "100%" }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={name}
        style={styles.button}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(62,107,137,0)", colors.primaryLight] }),
              paddingHorizontal: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 16] }),
            },
          ]}
        >
          <MaterialCommunityIcons name={focused ? activeIcon : idleIcon} size={22} color={focused ? colors.primary : colors.textFaint} />
          {focused ? (
            <Text style={styles.label} numberOfLines={1}>
              {name}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 64,
    borderRadius: radius.xl,
    paddingHorizontal: 6,
    overflow: "hidden",
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.72)" : colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31,42,51,0.08)",
    ...Platform.select({
      ios: { shadowColor: "#1F2A33", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 12 },
      default: { boxShadow: "0 10px 30px rgba(31,42,51,0.14)" },
    }),
  },
  button: { flex: 1, alignItems: "center", justifyContent: "center", height: "100%" },
  pill: { flexDirection: "row", alignItems: "center", height: 40, borderRadius: radius.pill, gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});

// Space screens should leave at the bottom so content clears the bar.
export const TAB_BAR_SPACE = 104;

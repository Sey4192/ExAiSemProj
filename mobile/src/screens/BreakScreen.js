import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, radius, spacing, type, fonts } from "../theme/theme";

const TOTAL_SECONDS = 60;
const PHASE_MS = 4000; // 4s in, 4s out

// What "Take a break" on the Alert screen leads to: a one-minute paced
// breathing exercise, so the intervention offers something to do rather
// than only telling the user to stop.
export default function BreakScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.6)).current;
  const [inhale, setInhale] = useState(true);
  const [left, setLeft] = useState(TOTAL_SECONDS);
  const done = left === 0;

  useEffect(() => {
    if (done) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: PHASE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: PHASE_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const phase = setInterval(() => setInhale((v) => !v), PHASE_MS);
    return () => {
      loop.stop();
      clearInterval(phase);
    };
  }, [done, scale]);

  useEffect(() => {
    if (done) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  return (
    <LinearGradient colors={gradients.low} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.eyebrow}>A minute for you</Text>
        <Text style={styles.title}>{done ? "Welcome back." : "Let's slow down together"}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.halo}>
          <Animated.View style={[styles.circle, { transform: [{ scale: done ? 0.8 : scale }] }]}>
            {done ? (
              <MaterialCommunityIcons name="check" size={44} color="#fff" accessibilityLabel="Done" />
            ) : (
              <Text style={styles.phase}>{inhale ? "Breathe in" : "Breathe out"}</Text>
            )}
          </Animated.View>
        </View>
        <Text style={styles.timer}>
          {done ? "How do you feel?" : `0:${String(left).padStart(2, "0")}`}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.note}>
          {done
            ? "If you head back in, maybe decide how long you'll stay first. And if you don't, even better."
            : "Breathe in as the circle grows, out as it shrinks. Put the phone down if you like. Nothing will buzz."}
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.popToTop()}
          buttonColor="#fff"
          textColor="#3F7A5C"
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {done ? "Back to my day" : "I'm done for now"}
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { alignItems: "center", paddingHorizontal: spacing.lg },
  eyebrow: { ...type.overline, color: "rgba(255,255,255,0.8)" },
  title: { ...type.h1, color: "#fff", marginTop: spacing.xs, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  halo: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  phase: { ...type.h2, color: "#fff" },
  timer: { ...type.h2, color: "#fff", marginTop: spacing.xl, fontVariant: ["tabular-nums"] },
  bottom: { paddingHorizontal: spacing.lg },
  note: { ...type.small, color: "rgba(255,255,255,0.9)", textAlign: "center", marginBottom: spacing.lg },
  button: { borderRadius: radius.md },
  buttonContent: { paddingVertical: 8 },
  buttonLabel: { fontSize: 16, fontFamily: fonts.bold },
});

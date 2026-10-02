import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { gradients, radius, spacing, type } from "../theme/theme";

// Curved gradient hero used at the top of every main screen.
// `onBack` shows a back arrow (for stack screens with no native header).
export default function GradientHeader({
  eyebrow,
  title,
  subtitle,
  colors = gradients.primary,
  rightIcon,
  rightLabel,
  onRightPress,
  onBack,
  children,
  compact = false,
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + spacing.md }, compact && styles.compact]}
    >
      {/* Soft decorative circles give the header depth without imagery. */}
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />

      {(onBack || rightIcon) && (
        <View style={styles.topRow}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={10} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
          ) : (
            <View />
          )}
          {rightIcon ? (
            <Pressable
              onPress={onRightPress}
              hitSlop={10}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={rightLabel || rightIcon}
            >
              <MaterialCommunityIcons name={rightIcon} size={22} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      )}

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  compact: { paddingBottom: spacing.lg },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  orbOne: { width: 220, height: 220, top: -80, right: -60 },
  orbTwo: { width: 140, height: 140, bottom: -50, left: -40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { ...type.overline, color: "rgba(255,255,255,0.75)", marginBottom: spacing.xs },
  title: { ...type.h1, color: "#fff" },
  subtitle: { ...type.body, color: "rgba(255,255,255,0.85)", marginTop: spacing.xs },
});

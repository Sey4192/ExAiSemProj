import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, type, fonts } from "../theme/theme";

// White rounded card used across the app. Pass onPress to make it
// tappable (with a subtle pressed state).
export function SurfaceCard({ children, style, onPress, padded = true }) {
  const content = [styles.card, padded && styles.padded, style];
  if (!onPress) return <View style={content}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...content, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction, style }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconBadge({ icon, color = colors.primary, bg = colors.primaryLight, size = 40 }) {
  return (
    <View style={[styles.iconBadge, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2.6 }]}>
      <MaterialCommunityIcons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function Pill({ label, color, bg, icon }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={13} color={color} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message, children }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {children}
    </View>
  );
}

export function ErrorNote({ message, onDismiss }) {
  if (!message) return null;
  return (
    <View style={styles.error}>
      <MaterialCommunityIcons name="wifi-off" size={18} color={colors.high} style={{ marginTop: 1 }} />
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
  padded: { padding: spacing.md + 2 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: spacing.lg,
    marginBottom: spacing.sm + 2,
  },
  sectionTitle: { ...type.h3, color: colors.text },
  sectionAction: { ...type.small, color: colors.primary, fontFamily: fonts.semibold },
  iconBadge: { alignItems: "center", justifyContent: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { ...type.caption, fontFamily: fonts.bold },
  empty: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...type.h3, color: colors.text, marginBottom: spacing.xs, textAlign: "center" },
  emptyMessage: { ...type.small, color: colors.textMuted, textAlign: "center", marginBottom: spacing.md },
  error: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.highBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { ...type.small, color: colors.text, flex: 1 },
});

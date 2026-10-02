import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { colors, radius, shadow, spacing, type } from "../theme/theme";
import { IconBadge } from "./Surface";

export default function StatTile({ icon, value, label, tint = colors.primary, bg = colors.primaryLight, style }) {
  return (
    <View style={[styles.tile, style]}>
      <IconBadge icon={icon} color={tint} bg={bg} size={36} />
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow,
  },
  value: { ...type.h2, color: colors.text, marginTop: spacing.sm + 2 },
  label: { ...type.caption, color: colors.textMuted, marginTop: 2 },
});

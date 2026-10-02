import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, type, fonts } from "../theme/theme";
import { FEATURES } from "../utils/format";

// Diverging bar centred on zero: bars to the right pushed the session
// towards high risk, bars to the left pulled it towards low risk. This
// keeps the sign of each SHAP/LIME value, which a plain magnitude bar
// would hide. Deliberately dependency-free rather than a chart library,
// so it runs in Expo Go with no native-module risk.
export default function ContributionBar({ feature, value, maxValue, color, highlight }) {
  const meta = FEATURES[feature] || { short: feature, icon: "circle-small" };
  const pct = maxValue > 0 ? Math.max(3, (Math.abs(value) / maxValue) * 100) : 3;
  const positive = value >= 0;
  // Values that round to zero shouldn't show a sign ("−0.000").
  const shown = Math.abs(value) < 0.0005 ? "0.000" : `${positive ? "+" : "−"}${Math.abs(value).toFixed(3)}`;

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <MaterialCommunityIcons
          name={meta.icon}
          size={15}
          color={highlight ? colors.primary : colors.textMuted}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.label, highlight && styles.labelHighlight]} numberOfLines={1}>
          {meta.short}
        </Text>
        <Text style={[styles.value, { color: shown === "0.000" ? colors.textFaint : positive ? colors.high : colors.low }]}>
          {shown}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={styles.half}>
          {!positive && <View style={[styles.fill, styles.fillLeft, { width: `${pct}%`, backgroundColor: colors.decrease }]} />}
        </View>
        <View style={styles.axis} />
        <View style={styles.half}>
          {positive && <View style={[styles.fill, styles.fillRight, { width: `${pct}%`, backgroundColor: color }]} />}
        </View>
      </View>
    </View>
  );
}

export function ContributionLegend({ color = colors.shapBar }) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.decrease }]} />
        <Text style={styles.legendText}>Kept it lighter</Text>
      </View>
      <View style={styles.legendItem}>
        <Text style={styles.legendText}>Made it heavier</Text>
        <View style={[styles.legendDot, { backgroundColor: color, marginLeft: 6, marginRight: 0 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md - 2 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  label: { ...type.small, color: colors.text, flex: 1 },
  labelHighlight: { fontFamily: fonts.bold },
  value: { ...type.caption, fontFamily: fonts.bold, fontVariant: ["tabular-nums"] },
  track: {
    flexDirection: "row",
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: "hidden",
  },
  half: { flex: 1, flexDirection: "row" },
  axis: { width: 2, backgroundColor: colors.border },
  fill: { height: "100%" },
  fillLeft: { marginLeft: "auto", borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  fillRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  legend: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { ...type.caption, color: colors.textMuted },
});

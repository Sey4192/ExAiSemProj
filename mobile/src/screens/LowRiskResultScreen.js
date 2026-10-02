import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, radius, spacing, type, fonts } from "../theme/theme";
import GradientHeader from "../components/GradientHeader";
import RiskGauge from "../components/RiskGauge";
import { IconBadge, SurfaceCard } from "../components/Surface";
import { FEATURES, FEATURE_KEYS, percent } from "../utils/format";

export default function LowRiskResultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;
  const { result } = entry;
  const { risk_probability, input, explanation } = result;

  // The factor that did most to keep this session healthy (most negative SHAP).
  const helper = Object.entries(explanation.shap).sort((a, b) => a[1] - b[1])[0];
  const helperKey = helper && helper[1] < 0 ? helper[0] : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GradientHeader colors={gradients.low} onBack={() => navigation.goBack()} eyebrow="Checked in">
          <View style={styles.hero}>
            <RiskGauge value={risk_probability} size={150} color="#FFFFFF" caption="risk" />
            <View style={styles.badge}>
              <MaterialCommunityIcons name="leaf" size={14} color="#fff" />
              <Text style={styles.badgeText}>Feeling balanced</Text>
            </View>
            <Text style={styles.message}>This looks like a balanced session. Nice one.</Text>
            <Text style={styles.confidence}>Only a {percent(risk_probability)} chance this is a heavy session</Text>
          </View>
        </GradientHeader>

        <View style={styles.body}>
          {helperKey ? (
            <SurfaceCard style={styles.helperCard}>
              <IconBadge icon={FEATURES[helperKey].icon} color={colors.low} bg={colors.lowBg} size={44} />
              <View style={{ flex: 1, marginLeft: spacing.md - 4 }}>
                <Text style={styles.cardTitle}>What's helping</Text>
                <Text style={styles.cardText}>
                  Your <Text style={styles.bold}>{FEATURES[helperKey].short.toLowerCase()}</Text> (
                  {FEATURES[helperKey].format(input[helperKey])}) is doing the most to keep things balanced. Keep it up.
                </Text>
              </View>
            </SurfaceCard>
          ) : null}

          <SurfaceCard style={styles.linkCard} onPress={() => navigation.navigate("Explanation", { entry })}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={colors.primary} />
            <Text style={styles.linkText}>See what shaped this</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
          </SurfaceCard>

          <Text style={styles.sectionTitle}>What I noticed</Text>
          <View style={styles.grid}>
            {FEATURE_KEYS.map((k) => (
              <View key={k} style={styles.cell}>
                <MaterialCommunityIcons name={FEATURES[k].icon} size={18} color={colors.low} />
                <Text style={styles.cellValue}>{FEATURES[k].format(input[k])}</Text>
                <Text style={styles.cellLabel}>{FEATURES[k].short}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <Button
          mode="contained"
          icon="check"
          onPress={() => navigation.popToTop()}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor={colors.low}
        >
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  hero: { alignItems: "center", marginTop: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: spacing.lg,
  },
  badgeText: { ...type.caption, color: "#fff", fontFamily: fonts.bold },
  message: { ...type.h2, color: "#fff", textAlign: "center", marginTop: spacing.md, lineHeight: 28 },
  confidence: { ...type.small, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: spacing.sm },

  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg },
  helperCard: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm + 2 },
  cardTitle: { ...type.h3, color: colors.text },
  cardText: { ...type.small, color: colors.textMuted, marginTop: 2 },
  bold: { fontFamily: fonts.bold, color: colors.text },
  linkCard: { flexDirection: "row", alignItems: "center", gap: spacing.md - 4 },
  linkText: { ...type.body, color: colors.text, fontFamily: fonts.semibold, flex: 1 },

  sectionTitle: { ...type.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm + 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm + 2 },
  cell: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellValue: { ...type.h3, color: colors.text, marginTop: spacing.sm },
  cellLabel: { ...type.caption, color: colors.textMuted },

  footer: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: { borderRadius: radius.md },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 15, fontFamily: fonts.semibold },
});

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gradients, radius, spacing, type, fonts } from "../theme/theme";
import GradientHeader from "../components/GradientHeader";
import RiskGauge from "../components/RiskGauge";
import { IconBadge, SurfaceCard } from "../components/Surface";
import { FEATURES, FEATURE_KEYS, featureLabel, percent } from "../utils/format";

const INTERVENTIONS = {
  gentle_limit: { icon: "timer-sand", label: "Time for a pause?" },
  reminder: { icon: "hand-wave-outline", label: "Just checking in" },
  motivational_message: { icon: "hand-heart-outline", label: "You've got this" },
};

// High-risk intervention screen (wireframe Screen 2). Deliberately calm:
// warm amber rather than red, no shame-based language, no sound or
// vibration -- a digital-wellbeing app that itself feels
// anxiety-inducing would work against its own purpose (Chapter 3,
// Section 3.7).
export default function AlertScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;
  const { result } = entry;
  const { intervention, risk_probability, explanation, input } = result;
  const kind = INTERVENTIONS[intervention.type] || INTERVENTIONS.reminder;
  const top = explanation.top_feature;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GradientHeader colors={gradients.high} onBack={() => navigation.goBack()} eyebrow="A gentle nudge">
          <View style={styles.hero}>
            <RiskGauge value={risk_probability} size={150} color="#FFFFFF" caption="risk" />
            <View style={styles.badge}>
              <MaterialCommunityIcons name={kind.icon} size={14} color="#fff" />
              <Text style={styles.badgeText}>{kind.label}</Text>
            </View>
            <Text style={styles.message}>{intervention.message}</Text>
            <Text style={styles.confidence}>I'm {percent(risk_probability)} sure this has turned into a heavy session</Text>
          </View>
        </GradientHeader>

        <View style={styles.body}>
          <SurfaceCard style={styles.whyCard} onPress={() => navigation.navigate("Explanation", { entry })}>
            <IconBadge icon="lightbulb-on-outline" color={colors.high} bg={colors.highBg} size={44} />
            <View style={{ flex: 1, marginHorizontal: spacing.md - 4 }}>
              <Text style={styles.whyTitle}>Why am I seeing this?</Text>
              <Text style={styles.whyText}>
                Mostly <Text style={styles.bold}>{featureLabel(top).toLowerCase()}</Text>. Tap to see everything I noticed.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textFaint} />
          </SurfaceCard>

          <Text style={styles.sectionTitle}>What I noticed</Text>
          <View style={styles.grid}>
            {FEATURE_KEYS.map((k) => (
              <View key={k} style={[styles.cell, k === top && styles.cellTop]}>
                <MaterialCommunityIcons name={FEATURES[k].icon} size={18} color={k === top ? colors.high : colors.textMuted} />
                <Text style={styles.cellValue}>{FEATURES[k].format(input[k])}</Text>
                <Text style={styles.cellLabel}>{FEATURES[k].short}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <Button mode="text" onPress={() => navigation.popToTop()} textColor={colors.textMuted} style={styles.dismiss}>
          I'm okay
        </Button>
        <Button
          mode="contained"
          icon="meditation"
          onPress={() => navigation.replace("Break")}
          style={styles.breakButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Take a breather
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
  whyCard: { flexDirection: "row", alignItems: "center" },
  whyTitle: { ...type.h3, color: colors.text },
  whyText: { ...type.small, color: colors.textMuted, marginTop: 2 },
  bold: { fontFamily: fonts.bold, color: colors.text },

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
  cellTop: { borderColor: colors.high, backgroundColor: colors.highBg },
  cellValue: { ...type.h3, color: colors.text, marginTop: spacing.sm },
  cellLabel: { ...type.caption, color: colors.textMuted },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dismiss: { marginRight: spacing.sm },
  breakButton: { flex: 1, borderRadius: radius.md },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontSize: 15, fontFamily: fonts.semibold },
});

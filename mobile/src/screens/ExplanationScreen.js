import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, fonts } from "../theme/theme";
import GradientHeader from "../components/GradientHeader";
import ContributionBar, { ContributionLegend } from "../components/ContributionBar";
import { IconBadge, Pill, SurfaceCard } from "../components/Surface";
import { FEATURES, contributionPhrase, featureLabel, percent, riskLevel } from "../utils/format";

// This is the screen we deliberately spent the most design effort on
// (per the project's own design-priority decision): it's the one that
// embodies the actual thesis of the project -- explainable AI you can
// trust. Shows both SHAP and LIME per Chapter 4's finding that they
// agree strongly (Spearman rho = 0.83) but not perfectly.
export default function ExplanationScreen({ route, navigation }) {
  const { entry } = route.params;
  const { result } = entry;
  const { shap, lime, top_feature } = result.explanation;
  const level = riskLevel(result.risk_probability);

  const view = useMemo(() => {
    const byShap = Object.keys(shap).sort((a, b) => Math.abs(shap[b]) - Math.abs(shap[a]));
    const limeTop = Object.keys(lime).sort((a, b) => Math.abs(lime[b]) - Math.abs(lime[a]))[0];
    const sameDirection = byShap.filter((f) => Math.sign(shap[f]) === Math.sign(lime[f])).length;
    return {
      order: byShap,
      maxShap: Math.max(...Object.values(shap).map(Math.abs)),
      maxLime: Math.max(...Object.values(lime).map(Math.abs)),
      limeTop,
      topAgrees: limeTop === top_feature,
      sameDirection,
    };
  }, [shap, lime, top_feature]);

  const topMeta = FEATURES[top_feature];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <GradientHeader
        onBack={() => navigation.goBack()}
        eyebrow="Why you're seeing this"
        title="Here's what I noticed"
        subtitle={`${level.label} · ${percent(result.risk_probability)} likely`}
      />

      <View style={styles.body}>
        <SurfaceCard style={styles.topCard}>
          <Text style={styles.overline}>What mattered most</Text>
          <View style={styles.topRow}>
            <IconBadge icon={topMeta?.icon || "star"} size={52} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.topTitle}>{featureLabel(top_feature)}</Text>
              <Text style={styles.topValue}>
                {topMeta ? topMeta.format(result.input[top_feature]) : result.input[top_feature]} ·{" "}
                {contributionPhrase(shap[top_feature])}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        <Text style={styles.sectionTitle}>Everything, in plain words</Text>
        <SurfaceCard>
          {view.order.map((f, i) => {
            const up = shap[f] >= 0;
            return (
              <View key={f} style={[styles.plainRow, i > 0 && styles.plainBorder]}>
                <MaterialCommunityIcons
                  name={up ? "arrow-up-circle" : "arrow-down-circle"}
                  size={22}
                  color={up ? colors.high : colors.low}
                />
                <Text style={styles.plainText}>
                  <Text style={styles.bold}>{FEATURES[f]?.short || f}</Text> ({FEATURES[f]?.format(result.input[f])}){" "}
                  {contributionPhrase(shap[f])}.
                </Text>
              </View>
            );
          })}
        </SurfaceCard>

        <View style={styles.methodHead}>
          <Text style={styles.sectionTitleInline}>SHAP</Text>
          <Pill label="Main view" color={colors.primary} bg={colors.primaryLight} />
        </View>
        <Text style={styles.methodCaption}>How much each part of your session counted, weighed fairly</Text>
        <SurfaceCard>
          <ContributionLegend />
          {view.order.map((f) => (
            <ContributionBar
              key={f}
              feature={f}
              value={shap[f]}
              maxValue={view.maxShap}
              color={colors.shapBar}
              highlight={f === top_feature}
            />
          ))}
        </SurfaceCard>

        <View style={styles.methodHead}>
          <Text style={styles.sectionTitleInline}>LIME</Text>
          <Pill label="Second opinion" color={colors.textMuted} bg={colors.border} />
        </View>
        <Text style={styles.methodCaption}>A separate check, worked out just for this session</Text>
        <SurfaceCard>
          <ContributionLegend color={colors.limeBar} />
          {view.order.map((f) => (
            <ContributionBar
              key={f}
              feature={f}
              value={lime[f]}
              maxValue={view.maxLime}
              color={colors.limeBar}
              highlight={f === view.limeTop}
            />
          ))}
        </SurfaceCard>

        <SurfaceCard style={[styles.agreeCard, { backgroundColor: view.topAgrees ? colors.lowBg : colors.mediumBg }]}>
          <MaterialCommunityIcons
            name={view.topAgrees ? "check-decagram" : "scale-unbalanced"}
            size={26}
            color={view.topAgrees ? colors.low : colors.medium}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.agreeTitle}>
              {view.topAgrees ? "Both views agree" : "The two views differ a little"}
            </Text>
            <Text style={styles.agreeText}>
              {view.topAgrees
                ? `SHAP and LIME both say ${featureLabel(top_feature).toLowerCase()} mattered most`
                : `SHAP points to ${featureLabel(top_feature).toLowerCase()}, LIME to ${featureLabel(view.limeTop).toLowerCase()}`}
              , and they agree on {view.sameDirection} of {view.order.length} things.
              {view.topAgrees ? " That makes this explanation easier to trust." : " Worth keeping in mind."}
            </Text>
          </View>
        </SurfaceCard>

        <Text style={styles.footnote}>
          I explain things two different ways so you never have to just take my word for it. When both views agree, you can
          trust the explanation more. The SHAP view is the one I use to decide what to say to you.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.lg },

  topCard: { paddingVertical: spacing.lg - 4 },
  overline: { ...type.overline, color: colors.textMuted, marginBottom: spacing.sm + 2 },
  topRow: { flexDirection: "row", alignItems: "center" },
  topTitle: { ...type.h2, color: colors.text },
  topValue: { ...type.small, color: colors.textMuted, marginTop: 2 },

  sectionTitle: { ...type.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm + 2 },
  sectionTitleInline: { ...type.h3, color: colors.text, marginRight: spacing.sm },
  methodHead: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  methodCaption: { ...type.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm + 2 },

  plainRow: { flexDirection: "row", alignItems: "center", gap: spacing.md - 4, paddingVertical: spacing.sm + 2 },
  plainBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  plainText: { ...type.small, color: colors.text, flex: 1 },
  bold: { fontFamily: fonts.bold },

  agreeCard: { flexDirection: "row", gap: spacing.md - 4, marginTop: spacing.lg, borderRadius: radius.lg },
  agreeTitle: { ...type.h3, color: colors.text },
  agreeText: { ...type.small, color: colors.textMuted, marginTop: 2 },

  footnote: { ...type.caption, color: colors.textMuted, marginTop: spacing.lg, fontStyle: "italic", lineHeight: 18 },
});

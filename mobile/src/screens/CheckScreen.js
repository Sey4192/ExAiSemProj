import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tap } from "../utils/haptics";
import { colors, radius, spacing, type, fonts } from "../theme/theme";
import { useRunCheck } from "../context/AppContext";
import GradientHeader from "../components/GradientHeader";
import Stepper from "../components/Stepper";
import FadeIn from "../components/FadeIn";
import { TAB_BAR_SPACE } from "../components/TabBar";
import { ErrorNote, SectionHeader, SurfaceCard } from "../components/Surface";
import { FEATURES } from "../utils/format";

// Ranges match what the model was trained on (ml/generate_data.py), so
// the user can't ask it about sessions it has never seen.
// The analyse button floats over content, so it gets its own lift.
const shadowLift = {
  shadowColor: colors.primary,
  shadowOpacity: 0.3,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
};

const LIMITS = {
  screen_time_hrs: { min: 0.25, max: 10, step: 0.25 },
  frequency: { min: 1, max: 80, step: 1 },
  session_duration_min: { min: 1, max: 120, step: 1 },
  hour_of_day: { min: 0, max: 23, step: 1 },
};

const PRESETS = [
  {
    key: "quick",
    icon: "coffee-outline",
    label: "Just a quick look",
    values: { screen_time_hrs: 1.25, frequency: 10, session_duration_min: 5, hour_of_day: 10 },
  },
  {
    key: "commute",
    icon: "bus",
    label: "Scrolling on the go",
    values: { screen_time_hrs: 2.5, frequency: 18, session_duration_min: 25, hour_of_day: 18 },
  },
  {
    key: "late",
    icon: "weather-night",
    label: "Can't put it down",
    values: { screen_time_hrs: 5.5, frequency: 34, session_duration_min: 75, hour_of_day: 23 },
  },
];

function currentHourDefaults() {
  return { screen_time_hrs: 2, frequency: 15, session_duration_min: 20, hour_of_day: new Date().getHours() };
}

export default function CheckScreen({ navigation }) {
  const [values, setValues] = useState(currentHourDefaults);
  const [preset, setPreset] = useState(null);
  const { run, loading, error, clearError } = useRunCheck(navigation);

  const set = (key) => (v) => {
    setPreset(null);
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const applyPreset = (p) => {
    tap();
    setPreset(p.key);
    setValues(p.values);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GradientHeader
          eyebrow="Check in"
          title="How's this session going?"
          subtitle="Tell me a little about it, and I'll help you see what's going on."
          compact
        />

        <View style={styles.body}>
          <FadeIn>
            <SectionHeader title="Which sounds most like you?" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
            {PRESETS.map((p) => {
              const active = preset === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => applyPreset(p)}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <MaterialCommunityIcons name={p.icon} size={18} color={active ? "#fff" : colors.primary} />
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          </FadeIn>

          <FadeIn index={1}>
            <SectionHeader title="Or tell me the details" />
          <SurfaceCard style={styles.form}>
            <Stepper
              icon={FEATURES.screen_time_hrs.icon}
              label="Screen time"
              hint="Roughly, today"
              value={values.screen_time_hrs}
              display={FEATURES.screen_time_hrs.format(values.screen_time_hrs)}
              {...LIMITS.screen_time_hrs}
              onChange={set("screen_time_hrs")}
            />
            <View style={styles.divider} />
            <Stepper
              icon={FEATURES.frequency.icon}
              label="App opens"
              hint="Times today"
              value={values.frequency}
              display={`${values.frequency}`}
              {...LIMITS.frequency}
              onChange={set("frequency")}
            />
            <View style={styles.divider} />
            <Stepper
              icon={FEATURES.session_duration_min.icon}
              label="Session length"
              hint="This time around"
              value={values.session_duration_min}
              display={FEATURES.session_duration_min.format(values.session_duration_min)}
              {...LIMITS.session_duration_min}
              onChange={set("session_duration_min")}
            />
            <View style={styles.divider} />
            <Stepper
              icon={FEATURES.hour_of_day.icon}
              label="Time of day"
              hint="When you started"
              value={values.hour_of_day}
              display={FEATURES.hour_of_day.format(values.hour_of_day)}
              {...LIMITS.hour_of_day}
              onChange={set("hour_of_day")}
            />
          </SurfaceCard>
            <Text style={styles.holdHint}>A rough guess is fine. Hold − or + to go faster.</Text>
          </FadeIn>

          <ErrorNote message={error} onDismiss={clearError} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          icon="hand-wave-outline"
          onPress={() => run(values)}
          loading={loading}
          disabled={loading}
          style={styles.submit}
          contentStyle={styles.submitContent}
          labelStyle={styles.submitLabel}
        >
          {loading ? "Taking a look…" : "Check in"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: TAB_BAR_SPACE + 76 },
  body: { paddingHorizontal: spacing.lg },
  presets: { gap: spacing.sm, paddingRight: spacing.lg },
  preset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { ...type.small, color: colors.text, fontFamily: fonts.semibold },
  presetTextActive: { color: "#fff" },
  form: { paddingVertical: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  holdHint: { ...type.caption, color: colors.textFaint, textAlign: "center", marginTop: spacing.sm },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: TAB_BAR_SPACE - 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  submit: { borderRadius: radius.md, ...shadowLift },
  submitContent: { paddingVertical: 6 },
  submitLabel: { fontSize: 15, fontFamily: fonts.semibold },
});

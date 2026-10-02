import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { colors, fonts, radius, spacing, type } from "../theme/theme";
import { SurfaceCard } from "./Surface";
import { tap } from "../utils/haptics";

export const MOODS = [
  {
    key: "calm",
    emoji: "😌",
    label: "Calm",
    reply: "Love that for you. Let's keep it that way.",
  },
  {
    key: "okay",
    emoji: "🙂",
    label: "Okay",
    reply: "Okay is perfectly okay. I'm here if that changes.",
  },
  {
    key: "restless",
    emoji: "😣",
    label: "Restless",
    reply: "Restless scrolling happens to everyone. Want to check how this session's going?",
    action: { label: "Check in", to: "Check" },
  },
  {
    key: "drained",
    emoji: "😮‍💨",
    label: "Drained",
    reply: "That sounds tiring. A one-minute breather might help more than another scroll.",
    action: { label: "Take a breather", to: "Break" },
  },
];

const TWO_HOURS = 2 * 60 * 60 * 1000;

// A light, optional emotional check-in. Answers stay on the phone and
// only shape the reply shown here; they aren't sent to the model.
export default function MoodCheck({ mood, onSelect, onAction }) {
  const recent = mood && Date.now() - mood.at < TWO_HOURS ? MOODS.find((m) => m.key === mood.key) : null;

  return (
    <SurfaceCard>
      <Text style={styles.title}>{recent ? "Thanks for telling me" : "How are you feeling right now?"}</Text>
      <View style={styles.row}>
        {MOODS.map((m) => {
          const active = recent?.key === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => {
                tap();
                onSelect(m.key);
              }}
              style={({ pressed }) => [styles.mood, active && styles.moodActive, pressed && { transform: [{ scale: 0.96 }] }]}
              accessibilityRole="button"
              accessibilityLabel={m.label}
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {recent ? (
        <View style={styles.reply}>
          <Text style={styles.replyText}>{recent.reply}</Text>
          {recent.action ? (
            <Button
              mode="contained-tonal"
              compact
              onPress={() => onAction(recent.action.to)}
              style={styles.replyButton}
              labelStyle={styles.replyButtonLabel}
            >
              {recent.action.label}
            </Button>
          ) : null}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h3, color: colors.text, marginBottom: spacing.md - 4 },
  row: { flexDirection: "row", gap: spacing.sm },
  mood: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  moodActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  emoji: { fontSize: 24 },
  moodLabel: { ...type.caption, color: colors.textMuted, marginTop: 4 },
  moodLabelActive: { color: colors.primary, fontFamily: fonts.bold },
  reply: {
    marginTop: spacing.md - 2,
    paddingTop: spacing.md - 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm + 2,
  },
  replyText: { ...type.small, color: colors.text },
  replyButton: { alignSelf: "flex-start", borderRadius: radius.md },
  replyButtonLabel: { fontFamily: fonts.bold, fontSize: 13, marginHorizontal: 14 },
});

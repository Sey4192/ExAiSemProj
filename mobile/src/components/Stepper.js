import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, type, fonts } from "../theme/theme";
import { IconBadge } from "./Surface";
import { tap } from "../utils/haptics";

// Number input built from -/+ buttons rather than a keyboard, so values
// always stay inside the range the model was trained on. Holding a
// button repeats the step.
export default function Stepper({ icon, label, hint, value, display, min, max, step, onChange }) {
  const timer = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const bump = (dir) => {
    const next = Number(clamp(valueRef.current + dir * step).toFixed(2));
    if (next === valueRef.current) return;
    tap();
    onChange(next);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  const startRepeat = (dir) => {
    timer.current = setInterval(() => bump(dir), 110);
  };
  const stopRepeat = () => {
    clearInterval(timer.current);
    timer.current = null;
  };

  return (
    <View style={styles.row}>
      <IconBadge icon={icon} size={40} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.control}>
        <StepButton icon="minus" disabled={value <= min} onPress={() => bump(-1)} onLongPress={() => startRepeat(-1)} onPressOut={stopRepeat} />
        <Text style={styles.value} numberOfLines={1}>
          {display}
        </Text>
        <StepButton icon="plus" disabled={value >= max} onPress={() => bump(1)} onLongPress={() => startRepeat(1)} onPressOut={stopRepeat} />
      </View>
    </View>
  );
}

function StepButton({ icon, disabled, ...handlers }) {
  return (
    <Pressable
      {...handlers}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={disabled ? colors.textFaint : colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm + 2 },
  text: { flex: 1, marginLeft: spacing.md - 4, marginRight: spacing.sm },
  label: { ...type.small, color: colors.text, fontFamily: fonts.semibold },
  hint: { ...type.caption, color: colors.textMuted },
  control: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    padding: 4,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: { backgroundColor: colors.primaryLight },
  buttonDisabled: { opacity: 0.5 },
  value: { ...type.h3, color: colors.text, minWidth: 60, textAlign: "center", fontVariant: ["tabular-nums"] },
});

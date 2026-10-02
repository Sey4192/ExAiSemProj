import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts } from "../theme/theme";

// Circular gauge showing the model's risk probability. The arc animates
// in so the number feels "measured" rather than just printed.
export default function RiskGauge({
  value = 0,
  size = 132,
  stroke = 12,
  color = colors.primary,
  track = "rgba(255,255,255,0.22)",
  textColor = "#fff",
  caption = "risk",
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => setShown(v));
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, anim]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - shown)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color: textColor, fontSize: size * 0.24 }]}>
          {Math.round(shown * 100)}
          <Text style={[styles.unit, { color: textColor, fontSize: size * 0.12 }]}>%</Text>
        </Text>
        <Text style={[styles.caption, { color: textColor }]}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  value: { fontFamily: fonts.bold, letterSpacing: -1 },
  unit: { fontFamily: fonts.semibold },
  caption: { fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1, marginTop: -2 },
});

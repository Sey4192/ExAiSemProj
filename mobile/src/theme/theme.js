import { Platform, StyleSheet } from "react-native";
import { MD3LightTheme } from "react-native-paper";

export const colors = {
  background: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#F9FAFB",

  primary: "#3E6B89",
  primaryDark: "#2C4F68",
  primaryLight: "#EAF1F5",
  onPrimary: "#FFFFFF",

  text: "#1F2A33",
  textMuted: "#6B7680",
  textFaint: "#9AA4AD",
  border: "#E4E8EB",

  low: "#4C8C6B",
  lowBg: "#EAF4EE",
  medium: "#B8953A",
  mediumBg: "#FAF4E3",
  high: "#C97A3D",
  highBg: "#FBF0E5",

  shapBar: "#3E6B89",
  limeBar: "#8FA6B5",
  decrease: "#7FAE96",
};

export const gradients = {
  primary: ["#2C4F68", "#3E6B89", "#5A8AA6"],
  low: ["#3F7A5C", "#4C8C6B", "#6FA88A"],
  high: ["#A8653A", "#C97A3D", "#D9975F"],
};

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

// One family per weight: Android fakes bold when fontWeight is set on a custom font.
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

export const type = {
  display: { fontSize: 34, fontFamily: fonts.extrabold, letterSpacing: -1 },
  h1: { fontSize: 27, fontFamily: fonts.extrabold, letterSpacing: -0.6, lineHeight: 34 },
  h2: { fontSize: 20, fontFamily: fonts.bold, letterSpacing: -0.3, lineHeight: 27 },
  h3: { fontSize: 16, fontFamily: fonts.bold, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  small: { fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
  overline: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.2, textTransform: "uppercase" },
};

export const shadow = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "rgba(31,42,51,0.06)",
  ...Platform.select({
    ios: {
      shadowColor: "#1F2A33",
      shadowOpacity: 0.07,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 3, shadowColor: "rgba(31,42,51,0.35)" },
    default: { boxShadow: "0 6px 20px rgba(31,42,51,0.07)" },
  }),
};

function familyFor(weight) {
  const w = String(weight || "400");
  if (w === "bold" || Number(w) >= 700) return fonts.bold;
  if (Number(w) >= 600) return fonts.semibold;
  if (Number(w) >= 500) return fonts.semibold;
  return fonts.regular;
}
const paperFonts = Object.fromEntries(
  Object.entries(MD3LightTheme.fonts).map(([variant, v]) => [
    variant,
    { ...v, fontFamily: familyFor(v.fontWeight), fontWeight: "normal" },
  ])
);

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondaryContainer: colors.primaryLight,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
    outline: colors.border,
  },
  fonts: paperFonts,
  roundness: 14,
};

export const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.high,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: "normal" },
    medium: { fontFamily: fonts.medium, fontWeight: "normal" },
    bold: { fontFamily: fonts.bold, fontWeight: "normal" },
    heavy: { fontFamily: fonts.extrabold, fontWeight: "normal" },
  },
};

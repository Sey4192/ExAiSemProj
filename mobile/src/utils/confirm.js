import { Alert, Platform } from "react-native";

// Alert does nothing in a browser, so the web version uses window.confirm.
export function confirm({ title, message, confirmText = "OK", destructive = false }) {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

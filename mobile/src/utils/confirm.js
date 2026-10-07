import { Alert, Platform } from "react-native";

// Asks a yes/no question and resolves to true if the user confirms.
// React Native's Alert does nothing in a web browser, so the web version
// uses the browser's own confirm dialog instead.
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

import { Platform, useWindowDimensions } from "react-native";

// In a computer's browser the app sits in a phone-sized column (see
// WebFrame in App.js); everywhere else it fills the screen.
export const WEB_FRAME_WIDTH = 440;

export function isFramed(windowWidth) {
  return Platform.OS === "web" && windowWidth > WEB_FRAME_WIDTH + 40;
}

// The width the app actually has to lay out in.
export function useAppWidth() {
  const { width } = useWindowDimensions();
  return isFramed(width) ? WEB_FRAME_WIDTH : width;
}

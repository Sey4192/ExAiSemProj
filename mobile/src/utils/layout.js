import { Platform, useWindowDimensions } from "react-native";

export const WEB_FRAME_WIDTH = 440;

export function isFramed(windowWidth) {
  return Platform.OS === "web" && windowWidth > WEB_FRAME_WIDTH + 40;
}

export function useAppWidth() {
  const { width } = useWindowDimensions();
  return isFramed(width) ? WEB_FRAME_WIDTH : width;
}

import type { ReactNode } from "react";
import {
  Linking,
  type GestureResponderEvent,
  type TextProps as NativeTextProps,
} from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type LinkTone = "accent" | "neutral" | "muted" | "inherit";

const TONE: Record<LinkTone, string> = {
  accent: "text-accent-text",
  neutral: "text-fg",
  muted: "text-fg-muted",
  inherit: "",
};

export type LinkProps = Omit<
  NativeTextProps,
  "accessibilityRole" | "role" | "onPress" | "children" | "className"
> & {
  children: ReactNode;
  /**
   * The address the tap opens through React Native `Linking`: `https:`,
   * `mailto:`, `tel:`. When `onPress` comes along, `onPress` does the
   * navigating, and `href` stays only as data.
   */
  href?: string;
  /**
   * What navigates inside the app: `onPress={() => router.push("/notas")}`. It
   * takes the place of the web `render`, which does not exist here because
   * there is no anchor.
   */
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * The color role, the same four as the web. `inherit` takes the color of the
   * surrounding `Text`, and is what goes inside an `Alert`.
   */
  tone?: LinkTone;
  /**
   * Leaves the app: draws the exit arrow and tells the screen reader with
   * `labels.external`, as a hint after the name.
   */
  external?: boolean;
  className?: string;
  /**
   * The component's texts, to change the language: `external` is the hint the
   * screen reader reads after the name of an `external` link, "Abre fora do
   * app." without it.
   */
  labels?: Partial<LinkLabels>;
};

export type LinkLabels = {
  external: string;
};

export function Link({
  children,
  href,
  onPress,
  tone = "accent",
  external = false,
  accessibilityLabel,
  accessibilityHint,
  labels,
  className,
  ...props
}: LinkProps) {
  const externalLabel = labels?.external ?? "Abre fora do app.";
  const press = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);
      return;
    }
    if (!href) return;
    Linking.openURL(href).catch((error: unknown) => {
      if (!__DEV__) return;
      console.warn(
        `Link: Linking did not open "${href}". A relative address has no app to open it: ` +
          "navigate through onPress, with the app's router.",
        error,
      );
    });
  };

  return (
    <Text
      {...props}
      accessibilityRole="link"
      accessibilityLabel={
        accessibilityLabel ?? (external && typeof children === "string" ? children : undefined)
      }
      accessibilityHint={accessibilityHint ?? (external ? externalLabel : undefined)}
      onPress={press}
      className={cn("underline", TONE[tone], className)}
    >
      {children}
      {external ? " ↗" : null}
    </Text>
  );
}

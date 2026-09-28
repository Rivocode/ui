import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Button } from "../button";
import { cn, type Slots } from "../cn";
import { useMotion } from "../motion";
import { MESSAGE_AUTHOR as AUTHOR, type MessageRole } from "../shared/ai";
import { Text } from "../text";

export type { MessageRole };

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function Dot({ delay }: { delay: number }) {
  const motion = useMotion();
  const fade = useSharedValue(1);

  useEffect(() => {
    if (motion.reduced) {
      cancelAnimation(fade);
      fade.value = 1;
      return;
    }
    const timer = setTimeout(() => {
      fade.value = withRepeat(
        withSequence(withTiming(0.3, motion.pulse), withTiming(1, motion.pulse)),
        -1,
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(fade);
    };
  }, [motion, delay, fade]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: fade.value };
  });

  return <Animated.View style={style} className="size-1.5 rounded-pill bg-fg-subtle" />;
}

function TypingIndicator({ className }: { className?: string }) {
  return (
    <View {...HIDDEN} className={cn("flex-row items-center gap-1 py-1.5", className)}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

export type MessageProps = {
  /**
   * Who is speaking. Decides alignment and look: `user` is the bubble on the
   * right, `assistant` is running text on the left, `system` is the discreet
   * line in the center.
   */
  role: MessageRole;
  /** The speaker's name, for the screen reader. Without it: "Você", "Assistente" or "Sistema". */
  author?: string;
  /** The `Avatar` next to the message. Not shown for `system`. */
  avatar?: ReactNode;
  /**
   * The content. Plain text becomes `Text` in the house body style; a node is
   * accepted, for those who render markdown.
   */
  children?: ReactNode;
  /** The text is still arriving: announces `busy`, shows the indicator and hides the actions. */
  streaming?: boolean;
  /**
   * Turns on the copy button. The component does not copy: `expo-clipboard`
   * lives in `@rivocode/ui-native/clipboard`, and the caller does the copying.
   */
  onCopy?: () => void;
  /** Turns on the retry button, which asks for another answer. */
  onRetry?: () => void;
  /** The names of the action buttons. Without them: "Copiar" and "Tentar de novo". */
  labels?: { copy?: string; retry?: string };
  /** Your own buttons, after copy and retry. */
  actions?: ReactNode;
  /** The answer failed: the sentence appears below the content, in the danger tone. */
  error?: string;
  className?: string;
  /**
   * Class per part: `avatar`, `bubble`, `content` (the content `Text`, when it
   * arrives as text), `indicator` (the three dots), `error` and `actions`.
   */
  classNames?: Slots<"avatar" | "bubble" | "content" | "indicator" | "error" | "actions">;
};

export function Message({
  role,
  author,
  avatar,
  children,
  streaming = false,
  onCopy,
  onRetry,
  labels = {},
  actions,
  error,
  className,
  classNames,
}: MessageProps) {
  const isUser = role === "user";
  const name = author ?? AUTHOR[role] ?? AUTHOR.assistant;
  const body =
    typeof children === "string" || typeof children === "number" ? (
      <Text className={cn("text-base text-fg", classNames?.content)}>{children}</Text>
    ) : (
      children
    );
  const hasContent = children !== undefined && children !== null && children !== "";
  const showActions = !streaming && (onCopy || onRetry || actions);

  if (role === "system") {
    return (
      <View accessibilityLabel={name} className={cn("w-full items-center px-4 py-1", className)}>
        {typeof children === "string" ? (
          <Text className={cn("text-center text-sm text-fg-muted", classNames?.content)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={name}
      accessibilityState={{ busy: streaming }}
      className={cn("w-full gap-3", isUser ? "flex-row-reverse" : "flex-row", className)}
    >
      {avatar ? <View className={cn("pt-0.5", classNames?.avatar)}>{avatar}</View> : null}

      <View className={cn("min-w-0 gap-1.5", isUser ? "max-w-[85%] items-end" : "flex-1")}>
        <View
          className={cn(
            isUser ? "rounded-lg rounded-br-sm bg-accent-subtle px-3.5 py-2.5" : "",
            classNames?.bubble,
          )}
        >
          {hasContent ? body : null}
          {streaming ? <TypingIndicator className={classNames?.indicator} /> : null}
        </View>

        {error ? (
          <Text className={cn("text-sm text-danger-text", classNames?.error)}>{error}</Text>
        ) : null}

        {showActions ? (
          <View className={cn("flex-row flex-wrap items-center gap-1", classNames?.actions)}>
            {onCopy ? (
              <Button variant="ghost" size="sm" onPress={onCopy}>
                {labels.copy ?? "Copiar"}
              </Button>
            ) : null}
            {onRetry ? (
              <Button variant="ghost" size="sm" onPress={onRetry}>
                {labels.retry ?? "Tentar de novo"}
              </Button>
            ) : null}
            {actions}
          </View>
        ) : null}
      </View>
    </View>
  );
}

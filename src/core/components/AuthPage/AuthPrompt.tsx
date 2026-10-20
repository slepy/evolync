import { Text, XStack } from "tamagui";

export interface AuthPromptProps {
  /** Muted question ("No account yet?"). */
  text: string;
  /** Bold link ("Sign up"). */
  action: string;
  onPress: () => void;
}

/** "No account yet? Sign up" line: muted question, bold 44px-tall link. */
export function AuthPrompt({ text, action, onPress }: AuthPromptProps) {
  return (
    <XStack alignItems="center" justifyContent="center" gap={4}>
      <Text fontSize={14} fontWeight="600" color="$neutralMuted">
        {text}
      </Text>
      <XStack role="link" aria-label={action} onPress={onPress} pressStyle={{ opacity: 0.7 }} height={44} alignItems="center" paddingHorizontal={8}>
        <Text fontSize={14} fontWeight="$button" color="$neutralText">
          {action}
        </Text>
      </XStack>
    </XStack>
  );
}

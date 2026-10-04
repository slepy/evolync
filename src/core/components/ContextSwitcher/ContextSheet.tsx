import type { ContextKey } from "@/core/theme/tokens";
import { Sheet, Text, YStack } from "tamagui";
import { ListCard, ListCheck, ListIcon, ListRow } from "../List";
import { CONTEXT_ICONS } from "./ContextSwitcher";

export interface ContextOption {
  id: string;
  /** Context the option opens: colors its icon (schools as a student are blue). */
  context: ContextKey;
  title: string;
  /** "Organization", "Student"… */
  subtitle?: string;
}

export interface ContextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ContextOption[];
  /** Id of the current context: 8% tint + check, like a select sheet row. */
  activeId: string | null;
  /** Called with the chosen option; the sheet closes itself. */
  onSelect: (option: ContextOption) => void;
  title?: string;
}

/**
 * Sheet opened by the context switcher: one list card, a row per context
 * with its icon in the target context color. Tap = switch and close.
 */
export function ContextSheet({ open, onOpenChange, options, activeId, onSelect, title }: ContextSheetProps) {
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPointsMode="fit" dismissOnSnapToBottom zIndex={200_000}>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        backgroundColor="$neutralRaised"
        borderTopLeftRadius="$header"
        borderTopRightRadius="$header"
        paddingHorizontal={20}
        paddingTop={10}
        paddingBottom={36}
      >
        <Sheet.Handle backgroundColor="$neutralControl" />
        <YStack gap={16} paddingTop={12}>
          <Text fontSize="$section" fontWeight="$section" letterSpacing={-0.2} color="$neutralText">
            {title ?? t("contextSwitchTitle")}
          </Text>
          <ListCard role="group" aria-label={title ?? t("contextSwitchTitle")}>
            {options.map((option) => {
              const selected = option.id === activeId;
              return (
                <ListRow
                  key={option.id}
                  size="md"
                  role="option"
                  title={option.title}
                  subtitle={option.subtitle}
                  leading={<ListIcon icon={CONTEXT_ICONS[option.context]} accent={option.context} size={44} />}
                  trailing={selected ? <ListCheck accent={option.context} /> : undefined}
                  selected={selected}
                  accent={option.context}
                  onPress={() => {
                    onOpenChange(false);
                    if (!selected) onSelect(option);
                  }}
                />
              );
            })}
          </ListCard>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

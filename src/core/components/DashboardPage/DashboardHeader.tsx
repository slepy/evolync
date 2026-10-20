import type { ReactNode } from "react";
import { XStack } from "tamagui";
import { ContextSwitcher } from "../ContextSwitcher/ContextSwitcher";
import type { SwitcherContext } from "../ContextSwitcher/contextMeta";

export interface DashboardHeaderProps {
  /** Organization (1A), School, Student (4), neutral (5): colors the switcher. */
  context: SwitcherContext;
  /** Organization / school name shown in the switcher. */
  title: string;
  /** Opens the context sheet; without it the switcher is a static label. */
  onSwitchPress?: () => void;
  switchLabel?: string;
  /** Right side, usually `<SyncedPill />`. */
  right?: ReactNode;
}

/** Top row of a dashboard: context switcher on the left, Synced pill (and friends) on the right. */
export function DashboardHeader({ context, title, onSwitchPress, switchLabel, right }: DashboardHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap={12} minHeight={44}>
      <ContextSwitcher context={context} title={title} onPress={onSwitchPress} label={switchLabel} />
      {right ? (
        <XStack alignItems="center" gap={8} flexShrink={0}>
          {right}
        </XStack>
      ) : null}
    </XStack>
  );
}

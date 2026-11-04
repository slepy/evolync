import { Building2, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, Text, YStack } from "tamagui";
import { bottomInsetPadding } from "../../utils/safeArea";
import { ListCard, ListCheck, ListIcon, ListRow, ListSection } from "../List";
import { ContextBadge } from "./ContextBadge";
import type { ContextOption } from "./types";

export interface ContextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ContextOption[];
  /** Id of the current context: check in its context color. */
  activeId: string | null;
  /** Called with the chosen option; the sheet closes itself. */
  onSelect: (option: ContextOption) => void;
  /** Last row of Train as student, "Join another school" (opens the join screen). */
  onJoinSchool?: () => void;
  title?: string;
  /** Muted line under the title (default: depends on whether an organization is listed). */
  description?: string;
}

/**
 * Sheet opened by the context switcher (board 3): title and description, the
 * organization under MANAGE, the schools the user trains in under TRAIN AS
 * STUDENT, closed by "Join another school". Tap = switch and close.
 */
export function ContextSheet({
  open,
  onOpenChange,
  options,
  activeId,
  onSelect,
  onJoinSchool,
  title,
  description,
}: ContextSheetProps) {
  const insets = useSafeAreaInsets();
  const manage = options.filter((o) => o.context !== "student");
  const train = options.filter((o) => o.context === "student");
  const heading = title ?? t("contextSwitchTitle");

  const renderRow = (option: ContextOption) => {
    const selected = option.id === activeId;
    return (
      <ListRow
        key={option.id}
        role="option"
        aria-selected={selected}
        title={option.title}
        subtitle={option.subtitle}
        leading={<ContextBadge context={option.context} icon={Building2} size={48} />}
        trailing={selected ? <ListCheck accent={option.context} /> : undefined}
        onPress={() => {
          onOpenChange(false);
          if (!selected) onSelect(option);
        }}
      />
    );
  };

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPointsMode="fit" dismissOnSnapToBottom zIndex={200_000}>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame
        backgroundColor="$neutralRaised"
        borderTopLeftRadius="$header"
        borderTopRightRadius="$header"
        paddingHorizontal={20}
        paddingTop={10}
        paddingBottom={bottomInsetPadding(32, insets.bottom)}
      >
        <Sheet.Handle backgroundColor="$neutralControl" />
        <YStack gap={20} paddingTop={12}>
          <YStack gap={4}>
            <Text fontSize={22} fontWeight="800" letterSpacing={-0.3} color="$neutralText">
              {heading}
            </Text>
            <Text fontSize={14} fontWeight="500" color="$neutralMuted">
              {description ??
                (manage.length > 0 ? t("contextSwitchDescription") : t("contextSwitchDescriptionStudent"))}
            </Text>
          </YStack>

          {manage.length > 0 ? (
            <ListSection title={t("manage")} variant="label">
              <ListCard role="group" aria-label={t("manage")}>
                {manage.map(renderRow)}
              </ListCard>
            </ListSection>
          ) : null}

          {train.length > 0 || onJoinSchool ? (
            <ListSection title={t("contextTrainAsStudent")} variant="label">
              <ListCard role="group" aria-label={t("contextTrainAsStudent")}>
                {train.map(renderRow)}
                {onJoinSchool ? (
                  <ListRow
                    role="button"
                    title={t("contextJoinAnotherSchool")}
                    subtitle={t("contextJoinAnotherSchoolHint")}
                    leading={<ListIcon icon={Plus} accent="neutral" />}
                    onPress={() => {
                      onOpenChange(false);
                      onJoinSchool();
                    }}
                  />
                ) : null}
              </ListCard>
            </ListSection>
          ) : null}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

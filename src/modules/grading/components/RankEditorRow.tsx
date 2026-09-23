import { BaseCard, TextInput } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { GripVertical, Trash2 } from "lucide-react-native";
import React, { useCallback } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { Circle, XStack, useTheme } from "tamagui";

interface RankEditorRowProps {
  id: string;
  name: string;
  color?: string | null;
  onUpdateName: (id: string, name: string) => void;
  onOpenColorPicker: (id: string) => void;
  onDelete: (id: string) => void;
  onInputFocus?: () => void;
  drag: () => void;
  autoFocus?: boolean;
  isKeyboardVisible?: boolean;
}

export const RankEditorRow: React.FC<RankEditorRowProps> = React.memo(({
  id,
  name,
  color,
  onUpdateName,
  onOpenColorPicker,
  onDelete,
  onInputFocus,
  drag,
  autoFocus,
  isKeyboardVisible,
}) => {
  const theme = useTheme();

  const dismissOrAction = useCallback(
    (action: () => void) => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      } else {
        action();
      }
    },
    [isKeyboardVisible],
  );

  const handleChangeName = useCallback(
    (name: string) => onUpdateName(id, name),
    [id, onUpdateName],
  );

  const handleOpenColorPicker = useCallback(
    () => onOpenColorPicker(id),
    [id, onOpenColorPicker],
  );

  const handleDelete = useCallback(
    () => onDelete(id),
    [id, onDelete],
  );

  return (
    <View onFocus={onInputFocus}>
      <BaseCard
        borderColor={color || "$borderColor"}
        onPress={() => dismissOrAction(() => {})}
        marginHorizontal={0}
      >
        <XStack gap="$3" alignItems="center" paddingRight="$2">
          <Pressable onLongPress={drag} delayLongPress={50}>
            <GripVertical
              size={20}
              color={theme.softGrayDark?.val}
              pointerEvents="none"
            />
          </Pressable>

          <Circle
            size={28}
            backgroundColor={color || "$softGrayLight"}
            borderWidth={1}
            borderColor="$softGrayDark"
            pressStyle={{ scale: 0.9 }}
            onPress={() => dismissOrAction(handleOpenColorPicker)}
            marginLeft="$1"
          />

          <TextInput
            flex={1}
            value={name}
            onChangeText={handleChangeName}
            placeholder={t("gradingRankNamePlaceholder")}
            autoFocus={autoFocus}
          />

          <Pressable
            onPress={() => confirmDelete(t("delete"), t("gradingDeleteRankConfirm"), () => dismissOrAction(handleDelete))}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Trash2
              size={17}
              color={theme.imperialRedDark?.val}
              pointerEvents="none"
            />
          </Pressable>
        </XStack>
      </BaseCard>
    </View>
  );
});

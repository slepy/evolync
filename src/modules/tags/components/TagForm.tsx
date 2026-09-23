import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Input, Text, YStack } from "tamagui";

export interface TagFormHandle {
  submit: () => void;
  isDirty: () => boolean;
}

interface Props {
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

export const TagForm = forwardRef<TagFormHandle, Props>(
  ({ initialName = "", onSubmit, onDirtyChange }, ref) => {
    const [name, setName] = useState(initialName);

    const handleNameChange = (value: string) => {
      setName(value);
      onDirtyChange?.(value.trim() !== initialName.trim());
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (!name.trim()) return;
        onSubmit(name.trim());
      },
      isDirty: () => name.trim() !== initialName.trim(),
    }));

    return (
      <YStack flex={1} justifyContent="center" padding="$6" gap="$3">
        <Text fontSize="$3" color="$softGrayDark">
          {t("tagsNewTagName")}
        </Text>
        <Input
          value={name}
          onChangeText={handleNameChange}
          placeholder={t("tagsNewTagName")}
          autoFocus
        />
      </YStack>
    );
  }
);

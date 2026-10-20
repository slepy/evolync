import { FormSheet, ListCard, ListIcon, ListRow } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import { Archive, Pencil } from "lucide-react-native";
import React from "react";
import { View } from "tamagui";

export interface StudentActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** Edit only for a student without an app account. */
  onEdit?: () => void;
  onArchive: () => void;
}

/** More actions (16G): Edit (no account only) and Archive in red. */
export const StudentActionsSheet: React.FC<StudentActionsSheetProps> = ({ open, onOpenChange, name, onEdit, onArchive }) => (
  <FormSheet open={open} onOpenChange={onOpenChange} title={name}>
    <ListCard>
      {onEdit ? (
        <ListRow
          size="md"
          title={t("edit")}
          subtitle={t("studentEditHint")}
          leading={<ListIcon icon={Pencil} accent="students" size={44} />}
          onPress={() => {
            onOpenChange(false);
            onEdit();
          }}
        />
      ) : null}
      <ListRow
        size="md"
        danger
        title={t("archive")}
        subtitle={t("studentArchiveHint")}
        leading={
          <View
            width={44}
            height={44}
            borderRadius={14}
            borderWidth={1}
            borderColor="$trashBorder"
            backgroundColor="$trashFill"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Archive size={20} color={danger.text} strokeWidth={2} />
          </View>
        }
        onPress={() => {
          onOpenChange(false);
          onArchive();
        }}
      />
    </ListCard>
  </FormSheet>
);

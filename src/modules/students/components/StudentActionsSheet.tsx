import { FormSheet, ListCard, ListIcon, ListRow } from "@/core/components";
import { danger } from "@/core/theme/tokens";
import { Archive, ArchiveRestore, Pencil } from "lucide-react-native";
import React from "react";
import { View } from "tamagui";

export interface StudentActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** Edit only for a student without an app account. */
  onEdit?: () => void;
  /** Active student: Archive in red (16G). */
  onArchive?: () => void;
  /** Archived student: Restore in the students accent (16G1). */
  onRestore?: () => void;
}

/** More actions (16G): Edit (no account only) and Archive in red; Restore for an archived student (16G1). */
export const StudentActionsSheet: React.FC<StudentActionsSheetProps> = ({
  open,
  onOpenChange,
  name,
  onEdit,
  onArchive,
  onRestore,
}) => (
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
      {onRestore ? (
        <ListRow
          size="md"
          title={t("restore")}
          subtitle={t("studentRestoreHint")}
          leading={<ListIcon icon={ArchiveRestore} accent="students" size={44} />}
          onPress={() => {
            onOpenChange(false);
            onRestore();
          }}
        />
      ) : null}
      {onArchive ? (
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
      ) : null}
    </ListCard>
  </FormSheet>
);

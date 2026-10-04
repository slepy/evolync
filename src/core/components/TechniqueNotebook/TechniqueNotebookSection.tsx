import { NotebookPen, Tags } from "lucide-react-native";
import { ListAddButton, ListCard, ListIcon, ListRow, ListSection } from "../List";

export interface TechniqueNotebookSectionProps {
  onOpenNotebook: () => void;
  onOpenTags: () => void;
  /** `+` on the Tags row: create a tag. */
  onAddTag: () => void;
}

/**
 * Technique notebook section shared by every dashboard: one list card with
 * "Open notebook" (Notebook cyan) and "Tags" (Tags rose, with a `+` to add a tag).
 */
export function TechniqueNotebookSection({ onOpenNotebook, onOpenTags, onAddTag }: TechniqueNotebookSectionProps) {
  return (
    <ListSection title={t("techniquesNotebook")}>
      <ListCard aria-label={t("techniquesNotebook")}>
        <ListRow
          title={t("notebookOpen")}
          subtitle={t("notebookOpenHint")}
          leading={<ListIcon icon={NotebookPen} accent="notebook" />}
          onPress={onOpenNotebook}
        />
        <ListRow
          title={t("tagsPicker")}
          subtitle={t("notebookTagsHint")}
          leading={<ListIcon icon={Tags} accent="tags" />}
          trailing={<ListAddButton accent="tags" label={t("tagsCreateNew")} onPress={onAddTag} />}
          onPress={onOpenTags}
        />
      </ListCard>
    </ListSection>
  );
}

import { useRouter } from "expo-router";
import { TechniqueNotebookSection } from "./TechniqueNotebookSection";

/** `TechniqueNotebookSection` wired to the notebook and tags screens; drop it on any dashboard. */
export function TechniqueNotebook() {
  const router = useRouter();

  return (
    <TechniqueNotebookSection
      onOpenNotebook={() => router.push("/techniques" as any)}
      onOpenTags={() => router.push("/tags" as any)}
      onAddTag={() => router.push("/tags?create=1" as any)}
    />
  );
}

import { NoteDetailsScreen } from "@/modules/techniques/notes/components";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function NoteDetailsRoute() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  return <NoteDetailsScreen documentId={documentId} />;
}

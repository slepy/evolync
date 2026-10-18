import { useState, useCallback } from "react";

export function useDirtyFlag() {
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = useCallback(() => setIsDirty(true), []);
  const reset = useCallback(() => setIsDirty(false), []);
  return { isDirty, markDirty, reset };
}

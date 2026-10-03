import { useEffect, useState } from "react";
import type { Observable } from "rxjs";

/**
 * Subscribes to an observable built from `deps` and exposes its latest value.
 * `factory` returning null means "nothing to observe" (e.g. missing id).
 */
export const useObservableValue = <T>(
  factory: () => Observable<T> | null,
  initial: T,
  deps: React.DependencyList,
  scope: string,
) => {
  const [value, setValue] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const observable = factory();
    if (!observable) {
      setValue(initial);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const subscription = observable.subscribe({
      next: (next) => {
        setValue(next);
        setError(null);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error(`[${scope}] Observer error:`, err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { value, isLoading, error };
};

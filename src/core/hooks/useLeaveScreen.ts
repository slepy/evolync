import { useCallback, useRef, useState, type ReactElement } from "react";

/**
 * Keeps a screen as it is while an action that leaves it (Save, Delete) runs
 * and after it succeeds. The action writes records the screen observes: they
 * re-emit, the Save footer hides (no changes left), a deleted record turns the
 * page into a loading / not-found view. Re-rendering that in the frame the
 * route is popped left Android with a black screen (attendance 4cc96d4,
 * event participants). `hold(view)` returns the view from the first render
 * after `leave` started (Save already shows its spinner) until the screen is
 * gone; a failure releases it and the screen shows what arrived meanwhile.
 *
 * `leave(action, onLeave)`: a second call while one runs is ignored; an
 * action resolving to `false` stays on the screen; a rejection stays and is
 * rethrown for the caller's error handling.
 */
export const useLeaveScreen = () => {
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const heldRef = useRef<ReactElement | null>(null);

  const leave = useCallback(async (action: () => Promise<unknown>, onLeave: () => void): Promise<boolean> => {
    if (leavingRef.current) return false;
    leavingRef.current = true;
    setLeaving(true);
    try {
      if ((await action()) === false) {
        leavingRef.current = false;
        setLeaving(false);
        return false;
      }
    } catch (err) {
      leavingRef.current = false;
      setLeaving(false);
      throw err;
    }
    onLeave();
    return true;
  }, []);

  /** Call on every return of the screen. */
  const hold = (view: ReactElement): ReactElement => {
    if (!leaving) {
      heldRef.current = null;
      return view;
    }
    if (!heldRef.current) heldRef.current = view;
    return heldRef.current;
  };

  return { leaving, leave, hold };
};

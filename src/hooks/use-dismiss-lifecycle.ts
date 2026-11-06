import { useEffect, useRef } from "react";

/** One close transaction per mounted modal, including interrupted native animations. */
export function useDismissLifecycle(onClose: () => void) {
  const session = useRef<{ phase: "open" | "closing" | "closed" | "unmounted"; serial: number; apply?: () => void }>({ phase: "open", serial: 0 });
  useEffect(() => {
    session.current.phase = "open";
    return () => { session.current = { phase: "unmounted", serial: session.current.serial }; };
  }, []);
  function begin(apply?: () => void) {
    if (session.current.phase !== "open") return;
    const serial = session.current.serial + 1;
    session.current = { phase: "closing", serial, apply };
    return serial;
  }
  function complete(serial: number) {
    if (session.current.phase !== "closing" || session.current.serial !== serial) return;
    const apply = session.current.apply;
    session.current = { phase: "closed", serial };
    try { apply?.(); } finally { onClose(); }
  }
  function cancel(serial: number) {
    if (session.current.phase !== "closing" || session.current.serial !== serial) return false;
    session.current = { phase: "open", serial };
    return true;
  }
  return { begin, complete, cancel };
}

import { useEffect, useState } from "react";

export function useResendCooldown(initialSeconds: number) {
  const [until, setUntil] = useState(() => Date.now() + initialSeconds * 1000);
  const [now, setNow] = useState(Date.now);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (until <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return {
    remaining,
    start: (seconds: number) => {
      setNow(Date.now());
      setUntil(Date.now() + seconds * 1000);
    },
  };
}

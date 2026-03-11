"use client";

import { useEffect, useState } from "react";

type DownloaderCooldownNoticeProps = {
  cooldownEndsAtMs: number | null;
  className?: string;
  dataTestId?: string;
};

function formatCountdown(secondsLeft: number) {
  const safeSeconds = Math.max(0, Math.ceil(secondsLeft));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DownloaderCooldownNotice({
  cooldownEndsAtMs,
  className,
  dataTestId,
}: DownloaderCooldownNoticeProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEndsAtMs) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remainingMs = cooldownEndsAtMs - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownEndsAtMs]);

  if (!cooldownEndsAtMs) return null;

  const text =
    secondsLeft > 0
      ? `Next download unlocks in ${formatCountdown(secondsLeft)}.`
      : "Next download is available now.";

  return (
    <p className={className} data-testid={dataTestId}>
      {text}
    </p>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@serp-tools/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@serp-tools/ui/components/dialog";
import {
  DOWNLOADER_EXTENSION_LABEL,
  DOWNLOADER_EXTENSION_TEXT,
  DOWNLOADER_EXTENSION_URL,
} from "@/lib/downloader-extension-cta";

type DownloaderExtensionCTAModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cooldownEndsAtMs: number | null;
};

function formatCountdown(secondsLeft: number) {
  const safeSeconds = Math.max(0, Math.ceil(secondsLeft));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DownloaderExtensionCTAModal({
  open,
  onOpenChange,
  cooldownEndsAtMs,
}: DownloaderExtensionCTAModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!open || !cooldownEndsAtMs) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remainingMs = cooldownEndsAtMs - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(nextSeconds);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [open, cooldownEndsAtMs]);

  const countdownText =
    secondsLeft > 0
      ? `Next download unlocks in ${formatCountdown(secondsLeft)}.`
      : "Next download is available now.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-md border-[#bfd4ff]">
        <DialogHeader className="text-left">
          <DialogTitle>Download Faster</DialogTitle>
          <DialogDescription className="text-sm text-[#12337a]">
            {DOWNLOADER_EXTENSION_TEXT}
          </DialogDescription>
        </DialogHeader>

        <p
          className="rounded-md bg-[#eef4ff] px-3 py-2 text-sm font-medium text-[#0f62fe]"
          data-testid="downloader-cta-cooldown"
        >
          {countdownText}
        </p>

        <DialogFooter className="sm:justify-start">
          <Button asChild className="group h-10 rounded-full bg-[#0f62fe] px-6 hover:bg-[#0b4ccc]">
            <a href={DOWNLOADER_EXTENSION_URL} target="_blank" rel="noreferrer">
              {DOWNLOADER_EXTENSION_LABEL}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

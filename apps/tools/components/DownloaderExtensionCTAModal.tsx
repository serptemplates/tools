"use client";

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
};

export default function DownloaderExtensionCTAModal({
  open,
  onOpenChange,
}: DownloaderExtensionCTAModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-md border-[#bfd4ff]">
        <DialogHeader className="text-left">
          <DialogTitle>Download Faster</DialogTitle>
          <DialogDescription className="text-sm text-[#12337a]">
            {DOWNLOADER_EXTENSION_TEXT}
          </DialogDescription>
        </DialogHeader>

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

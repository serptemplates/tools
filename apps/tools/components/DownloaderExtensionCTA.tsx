import { ArrowRight } from "lucide-react";
import { Button } from "@serp-tools/ui/components/button";

const DOWNLOADER_EXTENSION_URL = "https://serp.ly/serp-video-tools";
const DOWNLOADER_EXTENSION_TEXT =
  "Get the browser extension for unlimited downloads.";
const DOWNLOADER_EXTENSION_LABEL = "Get It Now";

export default function DownloaderExtensionCTA() {
  return (
    <section className="flex flex-col gap-3 border-b border-[#bfd4ff] bg-[#eef4ff] px-4 py-3 text-left sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:text-left">
      <p className="max-w-2xl text-[0.94rem] font-semibold leading-6 tracking-[-0.01em] text-[#12337a] sm:text-[0.98rem] lg:pr-8 lg:text-[1.04rem]">
        {DOWNLOADER_EXTENSION_TEXT}
      </p>

      <Button
        asChild
        size="lg"
        className="group h-10 w-full sm:w-auto rounded-full bg-[#0f62fe] px-6 text-[0.92rem] font-semibold text-white shadow-none ring-0 transition-colors duration-200 hover:bg-[#0b4ccc] focus-visible:ring-2 focus-visible:ring-[#0f62fe]/35"
      >
        <a href={DOWNLOADER_EXTENSION_URL} target="_blank" rel="noreferrer">
          {DOWNLOADER_EXTENSION_LABEL}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </Button>
    </section>
  );
}

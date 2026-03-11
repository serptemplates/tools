import {
  FileImage,
  FileJson,
  Image,
  Mic,
  Music,
  Table,
  Type,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type OperationType =
  | "bulk"
  | "combine"
  | "compress"
  | "convert"
  | "download"
  | "edit"
  | "view";

type ToolDirectorySource = {
  id: string;
  name: string;
  description: string;
  operation: string;
  route: string;
  isActive: boolean;
  from?: string;
  to?: string;
  tags?: string[];
  keywords?: string[];
  isNew?: boolean;
  isPopular?: boolean;
};

export type ToolDirectoryEntry = {
  id: string;
  name: string;
  description: string;
  category: OperationType;
  href: string;
  tags: string[];
  isNew: boolean;
  isPopular: boolean;
};

export type ToolDirectoryCategory = {
  id: OperationType;
  name: string;
  title: string;
  description: string;
  count: number;
  href: string;
};

type CategoryContent = {
  title: string;
  description: string;
};

const OPERATION_LABELS: Record<OperationType, string> = {
  bulk: "Bulk Operations",
  combine: "Combine",
  compress: "Compress",
  convert: "Convert",
  download: "Downloader",
  edit: "Edit",
  view: "View",
};

const TOOL_OPERATION_ORDER: OperationType[] = [
  "convert",
  "download",
  "compress",
  "combine",
  "bulk",
  "edit",
  "view",
];

const CATEGORY_CONTENT: Record<OperationType, CategoryContent> = {
  bulk: {
    title: "Bulk Operations",
    description: "Run batch file workflows and multi-file operations in a single pass.",
  },
  combine: {
    title: "Combine Tools",
    description: "Merge multiple files into one output without installing extra software.",
  },
  compress: {
    title: "Compress Tools",
    description: "Reduce file size online while keeping the output usable and shareable.",
  },
  convert: {
    title: "Convert Tools",
    description: "Convert image, audio, video, document, and data files directly in your browser.",
  },
  download: {
    title: "Downloader Tools",
    description: "Download supported public videos and media links straight to your device.",
  },
  edit: {
    title: "Edit Tools",
    description: "Open and edit supported files online without installing desktop software.",
  },
  view: {
    title: "View Tools",
    description: "Open and read supported files instantly in the browser.",
  },
};

const iconMap: Record<string, LucideIcon> = {
  "heic-to-jpg": Image,
  "heic-to-jpeg": Image,
  "heic-to-png": Image,
  "heic-to-pdf": FileImage,
  "heif-to-jpg": Image,
  "heif-to-png": Image,
  "heif-to-pdf": FileImage,
  "pdf-to-jpg": FileImage,
  "pdf-to-png": FileImage,
  "pdf-editor": FileImage,
  "pdf-editor-extension": FileImage,
  "pdf-editor-mac": FileImage,
  "pdf-editor-windows": FileImage,
  "pdf-reader": FileImage,
  "pdf-reader-extension": FileImage,
  "pdf-reader-mac": FileImage,
  "pdf-reader-windows": FileImage,
  "pdf-viewer": FileImage,
  "pdf-viewer-extension": FileImage,
  "pdf-viewer-windows": FileImage,
  "jpg-to-pdf": FileImage,
  "jpeg-to-pdf": FileImage,
  "jpg-to-png": Image,
  "png-to-jpg": Image,
  "jpeg-to-png": Image,
  "jpeg-to-jpg": Image,
  "webp-to-png": Image,
  "png-to-webp": Image,
  "jpg-to-webp": Image,
  "jpeg-to-webp": Image,
  "gif-to-webp": Image,
  "webp-to-jpg": Image,
  "webp-to-jpeg": Image,
  "avif-to-png": Image,
  "avif-to-jpg": Image,
  "avif-to-jpeg": Image,
  "bmp-to-jpg": Image,
  "bmp-to-png": Image,
  "ico-to-png": Image,
  "gif-to-jpg": Image,
  "gif-to-png": Image,
  "jfif-to-jpg": Image,
  "jfif-to-jpeg": Image,
  "jfif-to-png": Image,
  "jfif-to-pdf": FileImage,
  "cr2-to-jpg": Image,
  "cr3-to-jpg": Image,
  "dng-to-jpg": Image,
  "arw-to-jpg": Image,
  "jpg-to-svg": FileImage,
  "png-optimizer": Image,
  "csv-combiner": Table,
  "json-to-csv": FileJson,
  "character-counter": Type,
  "mkv-to-mp4": Video,
  "mkv-to-webm": Video,
  "mkv-to-avi": Video,
  "mkv-to-mov": Video,
  "mkv-to-gif": Image,
  "mkv-to-mp3": Music,
  "mkv-to-wav": Music,
  "mkv-to-ogg": Music,
  "batch-compress-png": Image,
  "audio-to-text": Mic,
  "audio-to-transcript": Mic,
  "mp3-to-transcript": Mic,
  "mp4-to-transcript": Mic,
  "video-to-transcript": Mic,
  "tiktok-to-transcript": Mic,
  "youtube-to-transcript": Mic,
  "youtube-to-transcript-generator": Mic,
  "video-downloader": Video,
  "download-loom-videos": Video,
};

function getOperationLabel(operation: OperationType): string {
  return OPERATION_LABELS[operation];
}

function isToolOperation(operation?: string): operation is OperationType {
  if (!operation) {
    return false;
  }

  return operation in OPERATION_LABELS;
}

function toCategoryPath(category: OperationType): string {
  return `/category/${category}/`;
}

function toCategoryContent(category: OperationType): CategoryContent {
  return CATEGORY_CONTENT[category];
}

function normalizeTags(tool: ToolDirectorySource): string[] {
  const values = [
    tool.from,
    tool.to,
    ...(tool.tags ?? []),
    ...(tool.keywords ?? []),
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(values));
}

export function getCategoryPagePath(category: OperationType): string {
  return toCategoryPath(category);
}

export function getCategoryPageContent(category: OperationType): CategoryContent {
  return toCategoryContent(category);
}

export function getToolDirectoryIcon(toolId: string): LucideIcon {
  if (toolId.startsWith("download-") || toolId.endsWith("-downloader")) {
    return Video;
  }

  return iconMap[toolId] ?? Image;
}

export function getAvailableToolOperations(tools: ToolDirectorySource[]): OperationType[] {
  const operations = new Set<OperationType>();

  tools.forEach((tool) => {
    if (!tool.isActive || !isToolOperation(tool.operation)) {
      return;
    }

    operations.add(tool.operation);
  });

  return TOOL_OPERATION_ORDER.filter((operation) => operations.has(operation));
}

export function getCategoryPagePaths(tools: ToolDirectorySource[]): string[] {
  return getAvailableToolOperations(tools).map((operation) => toCategoryPath(operation));
}

export function buildToolDirectoryEntries(tools: ToolDirectorySource[]): ToolDirectoryEntry[] {
  return tools
    .filter((tool) => tool.isActive)
    .map((tool) => {
      const category = isToolOperation(tool.operation) ? tool.operation : "convert";

      return {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category,
        href: tool.route ?? "/",
        tags: normalizeTags(tool),
        isNew: Boolean(tool.isNew),
        isPopular: Boolean(tool.isPopular),
      };
    });
}

export function getToolDirectoryCategories(
  tools: ToolDirectoryEntry[],
): ToolDirectoryCategory[] {
  const counts = new Map<OperationType, number>();

  tools.forEach((tool) => {
    counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
  });

  return TOOL_OPERATION_ORDER
    .map((operation) => {
      const count = counts.get(operation);
      if (!count) {
        return null;
      }

      const content = toCategoryContent(operation);

      return {
        id: operation,
        name: getOperationLabel(operation),
        title: content.title,
        description: content.description,
        count,
        href: toCategoryPath(operation),
      };
    })
    .filter((category): category is ToolDirectoryCategory => Boolean(category));
}

export function getToolsForDirectoryCategory(
  tools: ToolDirectoryEntry[],
  category: OperationType,
): ToolDirectoryEntry[] {
  return tools.filter((tool) => tool.category === category);
}

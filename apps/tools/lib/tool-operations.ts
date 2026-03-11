export const OPERATION_LABELS = {
  bulk: "Bulk Operations",
  combine: "Combine",
  compress: "Compress",
  convert: "Convert",
  download: "Downloaders",
  edit: "Edit",
  view: "PDF",
} as const;

export type ToolOperation = keyof typeof OPERATION_LABELS;

export const TOOL_OPERATION_ORDER: ToolOperation[] = [
  "convert",
  "download",
  "compress",
  "combine",
  "bulk",
  "edit",
  "view",
];

type OperationFallbackDescriptionArgs = {
  operation?: string;
  from?: string;
  to?: string;
  description?: string;
};

function formatValueLabel(value: string): string {
  if (!value) {
    return value;
  }

  return value.length <= 4 ? value.toUpperCase() : value;
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getOperationLabel(operation?: string): string {
  if (!operation) {
    return OPERATION_LABELS.convert;
  }

  return OPERATION_LABELS[operation as ToolOperation] ?? capitalize(operation);
}

export function isToolOperation(operation?: string): operation is ToolOperation {
  if (!operation) {
    return false;
  }

  return operation in OPERATION_LABELS;
}

export function buildOperationFallbackDescription({
  operation,
  from,
  to,
  description,
}: OperationFallbackDescriptionArgs): string {
  const fromLabel = formatValueLabel(from ?? "");
  const toLabel = formatValueLabel(to ?? "");

  switch (operation) {
    case "download":
      if (fromLabel) {
        return `Download ${fromLabel} files online.`;
      }
      return description ?? "Online downloader from SERP Tools.";
    case "compress":
      if (fromLabel) {
        return `Compress ${fromLabel} files online.`;
      }
      return description ?? "Online file compressor from SERP Tools.";
    case "combine":
      if (fromLabel && toLabel) {
        return `Combine ${fromLabel} into ${toLabel} online.`;
      }
      return description ?? "Online file combiner from SERP Tools.";
    case "view":
      if (fromLabel) {
        return `View ${fromLabel} files online.`;
      }
      return description ?? "Online file viewer from SERP Tools.";
    case "edit":
      if (fromLabel) {
        return `Edit ${fromLabel} files online.`;
      }
      return description ?? "Online file editor from SERP Tools.";
    default:
      if (fromLabel && toLabel) {
        return `Convert ${fromLabel} to ${toLabel} online.`;
      }
      return description ?? "Online file converter from SERP Tools.";
  }
}

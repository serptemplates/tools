import type { InfoArticleSectionData, HowToSectionData, Tool } from "@/types";

const formatLabel = (value: string | undefined) => {
  if (!value) return "";
  const upper = value.toUpperCase();
  if (upper === "JPG") return "JPG";
  if (upper === "SVG") return "SVG";
  return upper;
};

const buildLabels = (tool: Tool) => {
  const fromSource = tool.from ?? tool.content?.tool?.from;
  const toSource = tool.to ?? tool.content?.tool?.to;
  const fromLabel = formatLabel(fromSource) || "FILES";
  const toLabel = formatLabel(toSource) || fromLabel;
  return { fromLabel, toLabel };
};

const isCompressionTool = (tool: Tool) => {
  if (tool.operation === "compress") return true;
  const haystack = `${tool.name} ${tool.description}`.toLowerCase();
  return haystack.includes("compress") || haystack.includes("optimiz");
};

const actionVerb = (tool: Tool) => {
  if (tool.operation === "combine") return "combine";
  if (tool.operation === "download") return "download";
  if (tool.operation === "bulk" && isCompressionTool(tool)) return "batch compress";
  if (tool.operation === "bulk") return "batch convert";
  if (isCompressionTool(tool)) return "compress";
  return "convert";
};

export function buildHowToSection(tool: Tool): HowToSectionData {
  const { fromLabel, toLabel } = buildLabels(tool);
  const verb = actionVerb(tool);

  let title = `How to ${verb} ${fromLabel} to ${toLabel}`;
  let intro = `Follow these steps to ${verb} ${fromLabel} to ${toLabel} online.`;
  if (tool.operation === "combine") {
    title = `How to combine ${fromLabel} into one ${toLabel} file`;
    intro = `Follow these steps to merge ${fromLabel} files into one ${toLabel} file.`;
  } else if (tool.operation === "download") {
    title = `How to download ${fromLabel} files`;
    intro = `Follow these steps to download ${fromLabel} files to your device.`;
  } else if (isCompressionTool(tool) && fromLabel === toLabel) {
    title = `How to compress ${fromLabel} to smaller ${toLabel} files`;
    intro = `Follow these steps to compress ${fromLabel} files without losing quality.`;
  }

  const steps: string[] = [
    `Upload your ${fromLabel} file${tool.operation === "bulk" || tool.operation === "combine" ? "s" : ""}.`,
  ];

  if (tool.operation === "combine") {
    steps.push("Arrange or confirm the file order before combining.");
    steps.push(`Download the merged ${toLabel} file when the process finishes.`);
  } else if (tool.operation === "bulk") {
    steps.push(`We process each file and prepare the ${toLabel} outputs.`);
    steps.push("Download the results as a ZIP once processing completes.");
  } else if (tool.operation === "download") {
    steps.push("Start the download and wait for the file to finish.");
    steps.push("Save the file to your device.");
  } else {
    steps.push(`We ${verb} your file and prepare the ${toLabel} output.`);
    steps.push(`Download the new ${toLabel} file when the conversion completes.`);
  }

  return { title, intro, steps };
}

export function buildInfoArticleSection(tool: Tool): InfoArticleSectionData {
  const { fromLabel, toLabel } = buildLabels(tool);
  const verb = actionVerb(tool);
  let title = `About ${fromLabel} to ${toLabel} conversions`;
  if (tool.operation === "combine") {
    title = `About combining ${fromLabel} files`;
  } else if (tool.operation === "download") {
    title = `About downloading ${fromLabel} files`;
  } else if (isCompressionTool(tool)) {
    title = `About ${fromLabel} compression`;
  }

  let summary = `${tool.name} lets you ${verb} ${fromLabel} to ${toLabel} directly in your browser. Files are processed locally so your data stays on your device.`;
  if (tool.operation === "combine") {
    summary = `${tool.name} combines multiple ${fromLabel} files into a single ${toLabel} file without installing extra software.`;
  } else if (tool.operation === "download") {
    summary = `${tool.name} helps you download ${fromLabel} files quickly and save them to your device.`;
  } else if (isCompressionTool(tool)) {
    summary = `${tool.name} compresses ${fromLabel} files to reduce size while keeping quality intact.`;
  }

  const markdown = [
    summary,
    `Use this tool when you need ${toLabel} files for compatibility, sharing, or smaller sizes. It works on modern desktop and mobile browsers without installing software.`,
    `For best results, start with clean source files. Larger files take longer to process, especially for video or audio conversions.`,
    `**Why use this tool**`,
    `- Runs in the browser with no uploads required.`,
    `- Keeps your original file untouched.`,
    `- Works on desktop and mobile devices.`,
  ].join("\n\n");

  return { title, markdown };
}

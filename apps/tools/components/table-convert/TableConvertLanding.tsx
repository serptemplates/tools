import TableConvertDemo from "@/components/TableConvertDemo";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { HowToSection } from "@/components/sections/HowToSection";
import { InfoArticleSection } from "@/components/sections/InfoArticleSection";
import { RelatedAppsSection } from "@/components/sections/RelatedAppsSection";
import { TableConvertLinksSection } from "@/components/sections/TableConvertLinksSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { formatTableLabel } from "@/lib/table-convert";
import type { FAQ } from "@/types";
import type { InputFormat, OutputFormat } from "@/components/table-convert/types";

const buildSubtitle = (fromLabel: string, toLabel: string) =>
  `Paste or upload ${fromLabel} data, preview the table, and export ${toLabel} instantly.`;

const buildAboutSection = (fromLabel: string, toLabel: string) => ({
  title: `${fromLabel} to ${toLabel} table conversion`,
  fromFormat: {
    name: fromLabel,
    fullName: `${fromLabel} table data`,
    description: `Use ${fromLabel} as your input format and we will parse it into a clean table.`,
  },
  toFormat: {
    name: toLabel,
    fullName: `${toLabel} table output`,
    description: `Export the table to ${toLabel} format for your workflow or app.`,
  },
});

const buildHowToSection = (fromLabel: string, toLabel: string) => ({
  title: `How to convert ${fromLabel} to ${toLabel}`,
  intro: `Follow these steps to convert ${fromLabel} to ${toLabel} online.`,
  steps: [
    `Paste or upload your ${fromLabel} data.`,
    "Review the table preview and make edits if needed.",
    `Copy or download the ${toLabel} output when it is ready.`,
  ],
});

const buildInfoArticleSection = (fromLabel: string, toLabel: string) => ({
  title: `About ${fromLabel} to ${toLabel} conversions`,
  markdown: [
    `This converter turns ${fromLabel} table data into ${toLabel} format directly in your browser.`,
    `Use it when you need to move tabular data between tools, systems, or documentation formats.`,
    `**Why use this converter**`,
    `- Live table preview while you edit.`,
    `- Local processing in your browser.`,
    `- Easy copy or download of the result.`,
  ].join("\n\n"),
});

const buildFaqs = (fromLabel: string, toLabel: string): FAQ[] => [
  {
    question: `How do I convert ${fromLabel} to ${toLabel}?`,
    answer: `Paste or upload ${fromLabel} data, then copy or download the ${toLabel} output from the right panel.`,
  },
  {
    question: "Can I edit the table before exporting?",
    answer: "Yes. Use the online table editor in the middle to make quick edits before exporting.",
  },
  {
    question: "Does this run in the browser?",
    answer: "Yes. Everything runs locally in your browser, so your data stays on your device.",
  },
];

type TableConvertLandingProps = {
  from: InputFormat;
  to: OutputFormat;
  title: string;
  subtitle?: string;
};

export default function TableConvertLanding({
  from,
  to,
  title,
  subtitle,
}: TableConvertLandingProps) {
  const fromLabel = formatTableLabel(from);
  const toLabel = formatTableLabel(to);
  const resolvedSubtitle = subtitle ?? buildSubtitle(fromLabel, toLabel);
  const aboutSection = buildAboutSection(fromLabel, toLabel);
  const howTo = buildHowToSection(fromLabel, toLabel);
  const infoArticle = buildInfoArticleSection(fromLabel, toLabel);
  const faqs = buildFaqs(fromLabel, toLabel);
  const currentSlug = `${from}-to-${to}`;

  return (
    <main className="min-h-screen bg-background">
      <TableConvertDemo
        initialInputFormat={from}
        initialOutputFormat={to}
        title={title}
        subtitle={resolvedSubtitle}
      />

      <TableConvertLinksSection currentSlug={currentSlug} />

      <AboutFormatsSection
        title={aboutSection.title}
        fromFormat={aboutSection.fromFormat}
        toFormat={aboutSection.toFormat}
      />

      <HowToSection title={howTo.title} intro={howTo.intro} steps={howTo.steps} />

      <RelatedAppsSection currentFrom={from} currentTo={to} />

      <InfoArticleSection title={infoArticle.title} markdown={infoArticle.markdown} />

      <FAQSection faqs={faqs} />

      <ToolsLinkHub />
    </main>
  );
}

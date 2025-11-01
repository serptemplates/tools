import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getActiveExtensions } from "@serp-extensions/app-core/lib/catalog";

import {
  filterExtensionsForCollection,
  getBestCollectionConfig,
} from "@/data/bestCollections";
import { ExtensionsCatalog } from "@/components/ExtensionsCatalog";
import { rankExtensions } from "@/lib/ranking";
import {
  buildBreadcrumbSchema,
  buildImageGallerySchema,
  buildItemListSchema,
} from "@/lib/structured-data";
import { resolveBaseUrl } from "@/lib/sitemap-utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getBestCollectionConfig(slug);

  if (!config) {
    return {
      title: "Collection not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl = resolveBaseUrl();
  const canonical = `${baseUrl}/best/${slug}`;
  const title = `${config.title} | Expert-Curated Browser Extensions`;
  const description =
    config.description ??
    config.tagline ??
    `Browse the ${config.title.toLowerCase()} curated by the SERP research team.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: [config.title, "best browser extensions", "Chrome extensions", "SERP Extensions"],
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function BestCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getBestCollectionConfig(slug);

  if (!config) {
    notFound();
  }

  const allExtensions = await getActiveExtensions();
  const matchedExtensions = filterExtensionsForCollection(allExtensions, config);
  const rankedExtensions = rankExtensions(matchedExtensions).map((entry) => entry.extension);
  const displayExtensions = rankedExtensions.length > 0 ? rankedExtensions : matchedExtensions;
  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/best/${slug}`;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${baseUrl}/` },
    { name: "Best Lists", url: `${baseUrl}/best` },
    { name: config.title, url: pageUrl },
  ]);
  const collectionSchema = buildItemListSchema({
    title: config.title,
    description: config.description ?? config.tagline,
    pageUrl,
    baseUrl,
    extensions: displayExtensions,
    maxItems: 20,
  });
  const imageGallery = buildImageGallerySchema({
    pageUrl,
    images: displayExtensions
      .flatMap((extension) => [extension.icon, ...(extension.screenshots ?? [])])
      .filter((url): url is string => Boolean(url)),
    caption: `${config.title} screenshots and logos`,
  });
  const hasDescription = Boolean(config.description);
  const hasTagline = Boolean(config.tagline);
  const heroBlurb = hasDescription
    ? config.description
    : hasTagline
      ? config.tagline
      : "Discover the highest-rated extensions handpicked for this use case.";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <Script
        id={`best-${slug}-breadcrumbs`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id={`best-${slug}-collection`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {imageGallery ? (
        <Script
          id={`best-${slug}-gallery`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(imageGallery),
          }}
        />
      ) : null}
      <section className="relative overflow-hidden border-b bg-white">
        <div className="absolute inset-0 bg-grid-black/[0.02]" />
        <div className="container relative px-4 py-16 md:py-24">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div className="flex items-center gap-3 text-slate-500">
              <Link href="/" className="text-sm font-medium hover:text-slate-900">
                Home
              </Link>
              <span className="text-sm">/</span>
              <span className="text-sm font-medium text-slate-500">Best Lists</span>
              <span className="text-sm">/</span>
              <span className="text-sm font-medium text-slate-900">{config.title}</span>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
              Curated Collection
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {config.title}
              </h1>
              {hasTagline && hasDescription ? (
                <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {config.tagline}
                </p>
              ) : null}
              <p className="max-w-2xl text-lg text-slate-600">{heroBlurb}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
                <span className="font-semibold text-slate-900">{displayExtensions.length}</span> curated entries
              </span>
              {config.keywords.length > 0 && (
                <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
                  Keywords: {config.keywords.slice(0, 3).join(", ")}
                  {config.keywords.length > 3 ? "…" : ""}
                </span>
              )}
            </div>
            {config.highlight ? (
              <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-5 text-sm text-slate-700">
                {config.highlight}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-12">
        {displayExtensions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            We haven't curated extensions for this list yet. Know a great candidate? Reach out and we'll take a look.
          </div>
        ) : (
          <ExtensionsCatalog
            extensions={displayExtensions}
            categories={[]}
            showCategoryFilter={false}
            emptyStateMessage="No extensions match your search yet. Try another keyword."
          />
        )}
      </section>
    </main>
  );
}
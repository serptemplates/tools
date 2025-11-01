import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { icons } from "lucide-react";
import {
  getCategoryBySlug,
  getExtensionsByCategory,
} from "@serp-extensions/app-core/lib/catalog";
import { ExtensionsCatalog } from "@/components/ExtensionsCatalog";
import {
  buildBreadcrumbSchema,
  buildImageGallerySchema,
  buildItemListSchema,
} from "@/lib/structured-data";
import { resolveBaseUrl } from "@/lib/sitemap-utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function resolveIcon(name?: string) {
  if (!name) return icons.Folder;
  return icons[name as keyof typeof icons] ?? icons.Folder;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl = resolveBaseUrl();
  const canonical = `${baseUrl}/categories/${slug}`;
  const categoryTitle = category.name ?? category.slug.replace(/-/g, " ");
  const title = `${categoryTitle} Browser Extensions & Tools`;
  const description =
    category.description ??
    `Explore vetted ${categoryTitle.toLowerCase()} browser extensions curated by the SERP research team.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: [categoryTitle, "browser extensions", "Chrome extensions", "productivity tools", "SERP"],
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

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const extensions = await getExtensionsByCategory(slug);
  const Icon = resolveIcon(category.icon);
  const title = category.name ?? category.slug.replace(/-/g, " ");
  const description = category.description ?? "Discover extensions curated for this workflow.";
  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/categories/${slug}`;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${baseUrl}/` },
    { name: "Categories", url: `${baseUrl}/categories` },
    { name: title, url: pageUrl },
  ]);
  const collectionSchema = buildItemListSchema({
    title: `${title} Browser Extensions`,
    description,
    pageUrl,
    baseUrl,
    extensions,
    maxItems: 20,
  });
  const imageGallery = buildImageGallerySchema({
    pageUrl,
    images: extensions
      .flatMap((extension) => [extension.icon, ...(extension.screenshots ?? [])])
      .filter((url): url is string => Boolean(url)),
    caption: `${title} extension screenshots`,
  });

  const categoryFilters = [
    {
      id: category.slug,
      name: title,
      count: extensions.length,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <Script
        id={`category-${slug}-breadcrumbs`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id={`category-${slug}-collection`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {imageGallery ? (
        <Script
          id={`category-${slug}-gallery`}
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
              <Link href="/categories" className="text-sm font-medium hover:text-slate-900">
                Categories
              </Link>
              <span className="text-sm">/</span>
              <span className="text-sm font-medium text-slate-900">{title}</span>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
              <Icon className="h-4 w-4" />
              {category.slug}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {title} Extensions
              </h1>
              <p className="max-w-2xl text-lg text-slate-600">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
                <span className="font-semibold text-slate-900">{extensions.length}</span> curated entries
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2">
                Updated regularly with trusted picks from the SERP team.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-12">
        {extensions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
            No extensions have been curated for this category yet. Check back soon!
          </div>
        ) : (
          <ExtensionsCatalog
            extensions={extensions}
            categories={categoryFilters}
            showCategoryFilter={false}
            emptyStateMessage="No extensions match your search yet. Try another keyword."
          />
        )}
      </section>
    </main>
  );
}

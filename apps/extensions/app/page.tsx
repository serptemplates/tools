import type { Metadata } from "next";
import Script from "next/script";
import { getActiveExtensions, getCategoriesWithCounts } from "@serp-extensions/app-core/lib/catalog";

import { HomePageClient } from "@/components/HomePageClient";
import {
  buildItemListSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "@/lib/structured-data";
import { resolveBaseUrl } from "@/lib/sitemap-utils";

export const metadata: Metadata = {
  title: "Discover Trusted Browser Extensions for SEO, Marketing, and Productivity",
  description:
    "Explore the SERP Extensions catalog to find vetted Chrome and Firefox tools for research, automation, reporting, and competitive intelligence.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [extensions, categories] = await Promise.all([
    getActiveExtensions(),
    getCategoriesWithCounts(),
  ]);

  const baseUrl = resolveBaseUrl();
  const homepageUrl = `${baseUrl}/`;
  const websiteSchema = buildWebsiteSchema(baseUrl);
  const organizationSchema = buildOrganizationSchema(baseUrl);
  const collectionSchema = buildItemListSchema({
    title: "SERP Extensions Catalog",
    description: "Curated list of browser extensions vetted by the SERP research team.",
    pageUrl: homepageUrl,
    baseUrl,
    extensions,
    maxItems: 15,
  });

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="homepage-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />

      <HomePageClient extensions={extensions} categories={categories} />
    </>
  );
}
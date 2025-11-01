import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

export const SITE_NAME = "SERP Extensions";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_PRICE = "0";
const DEFAULT_AVAILABILITY = "https://schema.org/InStock";
const DEFAULT_OPERATING_SYSTEMS = ["Google Chrome", "Microsoft Edge", "Brave", "Opera", "Firefox", "Chromium"].join(", ");

type BreadcrumbItem = {
  name: string;
  url: string;
};

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function toImageObject(url: string, caption?: string) {
  return {
    "@type": "ImageObject",
    url,
    ...(caption ? { caption } : {}),
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebsiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    sameAs: [
      "https://serp.co",
      "https://www.linkedin.com/company/serp-co/",
      "https://twitter.com/serp_co",
    ],
  };
}

export function buildItemListSchema(params: {
  title: string;
  description?: string;
  pageUrl: string;
  baseUrl: string;
  extensions: ExtensionRecord[];
  maxItems?: number;
}) {
  const { title, description, pageUrl, baseUrl, extensions, maxItems = 12 } = params;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: baseUrl,
    },
    hasPart: {
      "@type": "ItemList",
      itemListElement: extensions.slice(0, maxItems).map((extension, index) => {
        const image = extension.icon ?? extension.screenshots[0];

        return {
          "@type": "ListItem",
          position: index + 1,
          name: extension.name,
          url: `${baseUrl}/extensions/${extension.slug}/${extension.id}`,
          description: extension.description,
          ...(image ? { image } : {}),
        };
      }),
    },
  };
}

export function buildSoftwareApplicationSchema(params: {
  extension: ExtensionRecord;
  pageUrl: string;
  categoryName?: string;
}) {
  const { extension, pageUrl, categoryName } = params;
  const screenshots = uniqueStrings(extension.screenshots ?? []);
  const images = uniqueStrings([
    extension.icon,
    ...screenshots,
  ]);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: extension.name,
    description: extension.overview ?? extension.description,
    applicationCategory: categoryName ?? "BrowserApplication",
    operatingSystem: DEFAULT_OPERATING_SYSTEMS,
    offers: {
      "@type": "Offer",
      price: DEFAULT_PRICE,
      priceCurrency: DEFAULT_CURRENCY,
      availability: DEFAULT_AVAILABILITY,
      url: pageUrl,
    },
    ...(extension.rating && extension.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(extension.rating.toFixed(1)),
            reviewCount: extension.ratingCount,
            ratingCount: extension.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(images.length > 0
      ? {
          image: images,
          screenshot: images.map((url) => toImageObject(url)),
        }
      : {}),
    ...(extension.version ? { softwareVersion: extension.version } : {}),
    ...(extension.size ? { fileSize: extension.size } : {}),
    ...(extension.updated ? { dateModified: extension.updated } : {}),
    ...(extension.developer?.name
      ? {
          author: {
            "@type": "Organization",
            name: extension.developer.name,
            ...(extension.developer.website ? { url: extension.developer.website } : {}),
          },
        }
      : {
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: pageUrl,
          },
        }),
    ...(extension.features?.length
      ? { featureList: extension.features }
      : {}),
    ...(extension.supportSite
      ? { softwareHelp: extension.supportSite }
      : {}),
    ...(extension.privacyPolicy
      ? { privacyPolicy: extension.privacyPolicy }
      : {}),
    ...(extension.chromeStoreUrl ? { downloadUrl: extension.chromeStoreUrl } : {}),
    ...(extension.firefoxAddonUrl ? { installUrl: extension.firefoxAddonUrl } : {}),
  };
}

export function buildProductSchema(params: {
  extension: ExtensionRecord;
  pageUrl: string;
  categoryName?: string;
}) {
  const { extension, pageUrl, categoryName } = params;
  const images = uniqueStrings([extension.icon, ...(extension.screenshots ?? [])]);
  const brandName = extension.developer?.name ?? SITE_NAME;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: extension.name,
    description: extension.description,
    sku: extension.id,
    url: pageUrl,
    category: categoryName ?? extension.category ?? "Browser Extension",
    brand: {
      "@type": "Brand",
      name: brandName,
      ...(extension.developer?.website ? { url: extension.developer.website } : {}),
    },
    offers: {
      "@type": "Offer",
      price: DEFAULT_PRICE,
      priceCurrency: DEFAULT_CURRENCY,
      availability: DEFAULT_AVAILABILITY,
      url: pageUrl,
    },
    ...(images.length > 0 ? { image: images.map((url) => toImageObject(url, extension.name)) } : {}),
    ...(extension.rating && extension.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(extension.rating.toFixed(1)),
            reviewCount: extension.ratingCount,
            ratingCount: extension.ratingCount,
            bestRating: 5,
          },
        }
      : {}),
  };
}

export function buildImageGallerySchema(params: {
  pageUrl: string;
  images: string[];
  caption?: string;
}) {
  const { pageUrl, images, caption } = params;
  const uniqueImages = uniqueStrings(images);

  if (uniqueImages.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: caption ?? `${SITE_NAME} Media Gallery`,
    url: pageUrl,
    image: uniqueImages.map((url) => toImageObject(url, caption)),
  };
}

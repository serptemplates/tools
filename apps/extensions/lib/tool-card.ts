import type { ExtensionRecord } from "@serp-extensions/app-core/lib/catalog";

export type ToolCardData = {
  id: string;
  name: string;
  description: string;
  href: string;
  imageUrl?: string;
  iconName?: string;
  rating?: number;
  users?: string;
  isPopular?: boolean;
  isNew?: boolean;
};

export function mapExtensionToToolCard(extension: ExtensionRecord): ToolCardData {
  return {
    id: extension.id,
    name: extension.name,
    description: extension.description,
    href: `/extensions/${extension.slug}/${extension.id}`,
    imageUrl: extension.icon,
    rating: extension.rating,
    users: extension.users,
    isPopular: extension.isPopular,
    isNew: extension.isNew,
  };
}

export function mapExtensionsToToolCards(extensions: ExtensionRecord[]): ToolCardData[] {
  return extensions.map(mapExtensionToToolCard);
}

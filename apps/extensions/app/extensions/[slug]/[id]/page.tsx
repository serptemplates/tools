import Link from "next/link";
import { Button } from "@serp-extensions/ui/components/button";
import { Badge } from "@serp-extensions/ui/components/badge";
import { ChevronRight, Star, Users, ExternalLink, Globe, Check, Tag, Zap } from "lucide-react";
import extensionsData from '@serp-extensions/app-core/data/extensions.json';
import categoriesData from '@serp-extensions/app-core/data/categories.json';
import topicsData from '@serp-extensions/app-core/data/topics.json';
import { RelatedToolsSection } from "@/components/sections/RelatedToolsSection";

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function ExtensionPage({ params }: PageProps) {
  // Await params for Next.js 15+
  const { slug, id } = await params;
  
  // Find extension by slug and id (server-side compatible)
  const extension = (extensionsData as any[]).find(
    (ext: any) => ext.slug === slug && ext.id === id && ext.isActive
  );
  
  // Find category info
  const category = (categoriesData as any[]).find(
    (cat: any) => cat.slug === extension?.category
  );

  
  // Get topic names
  const topicNames = extension?.topics?.map((topicSlug: string) => 
    (topicsData as any[]).find((t: any) => t.slug === topicSlug)?.name
  ).filter(Boolean) || [];

  if (!extension) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Extension Not Found</h1>
              <Link href="/">
                <Button>Back to Extensions</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-gray-300"
        }`}
      />
    ));
  };  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              Extensions
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{extension.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            {/* Extension Icon and Header */}
            <div className="flex items-start gap-6 mb-8">
              {extension.icon && (
                <div className="flex-shrink-0">
                  <img
                    src={extension.icon}
                    alt={extension.name}
                    className="w-32 h-32 rounded-lg shadow-lg border-4 border-white bg-white"
                  />
                </div>
              )}
              <div>
                {/* Badges */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {category && (
                    <Badge className="capitalize">
                      {category.name}
                    </Badge>
                  )}
                  {extension.isNew && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      New
                    </Badge>
                  )}
                  {extension.isPopular && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Title and Description */}
                <h1 className="text-5xl font-bold mb-4 text-gray-900">{extension.name}</h1>
                <p className="text-2xl text-gray-700 mb-8 leading-relaxed">{extension.description}</p>
              </div>
            </div>

            {/* Rating & Users Stats */}
            <div className="flex flex-wrap gap-8 mb-10 pb-8 border-b">
              {extension.rating && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(extension.rating)}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{extension.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">
                      {extension.ratingCount ? `${extension.ratingCount.toLocaleString()} ratings` : 'out of 5'}
                    </div>
                  </div>
                </div>
              )}
              {extension.users && (
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-bold text-lg">{extension.users}</div>
                    <div className="text-sm text-gray-600">users</div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {extension.chromeStoreUrl && (
                <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2">
                    <Globe className="w-5 h-5" />
                    Add to Chrome
                  </Button>
                </a>
              )}
              {extension.firefoxAddonUrl && (
                <a href={extension.firefoxAddonUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Globe className="w-5 h-5" />
                    Add to Firefox
                  </Button>
                </a>
              )}
              {extension.url && !extension.chromeStoreUrl && !extension.firefoxAddonUrl && (
                <a href={extension.url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Visit Website
                  </Button>
                </a>
              )}
              {extension.url && (extension.chromeStoreUrl || extension.firefoxAddonUrl) && (
                <a href={extension.url} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Learn More
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      {extension.overview && (
        <div className="py-12 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">About</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{extension.overview}</p>
          </div>
        </div>
      )}

      {/* Features Section */}
      {extension.features && extension.features.length > 0 && (
        <div className="py-12 bg-white border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Key Features</h2>
            <div className="grid gap-4">
              {extension.features.map((feature: string, index: number) => (
                <div key={index} className="flex gap-4 p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100">
                  <Check className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screenshots Section */}
      {extension.screenshots && extension.screenshots.length > 0 && (
        <div className="py-12 border-b bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Screenshots</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extension.screenshots.map((screenshot: string, index: number) => (
                <div key={index} className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow">
                  <img
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Topics Section */}
      {extension.topics && extension.topics.length > 0 && topicNames.length > 0 && (
        <div className="py-12 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Topics & Categories</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {topicNames.map((topic: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-base py-2 px-4">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags Section */}
      {extension.tags && extension.tags.length > 0 && (
        <div className="py-12 bg-white border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {extension.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-base py-2 px-3 capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Store Links Summary */}
      <div className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Available On</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {extension.chromeStoreUrl && (
              <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer" className="group">
                <div className="p-6 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-900">Chrome Web Store</h4>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900">Download from Chrome Web Store →</p>
                </div>
              </a>
            )}
            {extension.firefoxAddonUrl && (
              <a href={extension.firefoxAddonUrl} target="_blank" rel="noopener noreferrer" className="group">
                <div className="p-6 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-900">Firefox Add-ons</h4>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900">Download from Firefox Add-ons →</p>
                </div>
              </a>
            )}
            {extension.url && (
              <a href={extension.url} target="_blank" rel="noopener noreferrer" className="group">
                <div className="p-6 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-900">Official Website</h4>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900">Visit official site →</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Extension Details Section */}
      {(extension.version || extension.updated || extension.size || extension.languages || extension.developer) && (
        <div className="py-12 border-b bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Details</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extension.version && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-600 text-sm mb-2 uppercase">Version</h4>
                  <p className="text-lg font-bold text-gray-900">{extension.version}</p>
                </div>
              )}
              {extension.updated && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-600 text-sm mb-2 uppercase">Last Updated</h4>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(extension.updated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {extension.size && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-600 text-sm mb-2 uppercase">Size</h4>
                  <p className="text-lg font-bold text-gray-900">{extension.size}</p>
                </div>
              )}
              {extension.languages && extension.languages.length > 0 && (
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-600 text-sm mb-2 uppercase">Languages</h4>
                  <p className="text-lg font-bold text-gray-900">{extension.languages.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Developer Info */}
            {extension.developer && (
              <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Developer</h4>
                <div className="space-y-2">
                  {extension.developer.name && (
                    <p>
                      <span className="text-gray-600 font-medium">Name:</span>
                      <span className="ml-2 text-gray-900">{extension.developer.name}</span>
                    </p>
                  )}
                  {extension.developer.website && (
                    <p>
                      <span className="text-gray-600 font-medium">Website:</span>
                      <a href={extension.developer.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                        {extension.developer.website}
                      </a>
                    </p>
                  )}
                  {extension.developer.email && (
                    <p>
                      <span className="text-gray-600 font-medium">Email:</span>
                      <a href={`mailto:${extension.developer.email}`} className="ml-2 text-blue-600 hover:underline">
                        {extension.developer.email}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Support & Privacy Links */}
            {(extension.privacyPolicy || extension.supportSite || extension.website) && (
              <div className="mt-8 grid md:grid-cols-3 gap-4">
                {extension.privacyPolicy && (
                  <a href={extension.privacyPolicy} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                      <h5 className="font-semibold text-gray-900 mb-1">Privacy Policy</h5>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900">Learn about data usage →</p>
                    </div>
                  </a>
                )}
                {extension.supportSite && (
                  <a href={extension.supportSite} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                      <h5 className="font-semibold text-gray-900 mb-1">Support</h5>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900">Get help & report issues →</p>
                    </div>
                  </a>
                )}
                {extension.website && (
                  <a href={extension.website} target="_blank" rel="noopener noreferrer" className="group">
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                      <h5 className="font-semibold text-gray-900 mb-1">Official Website</h5>
                      <p className="text-sm text-gray-600 group-hover:text-gray-900">Visit website →</p>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Extensions */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <RelatedToolsSection 
            currentFrom=""
            currentTo=""
            currentPath={`/extensions/${extension.slug}/${extension.id}`}
          />
        </div>
      </div>
    </main>
  );
}

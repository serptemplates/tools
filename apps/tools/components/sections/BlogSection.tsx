type BlogPost = {
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  category?: string;
  image?: string;
};

type BlogSectionProps = {
  blogPosts: BlogPost[];
};

export function BlogSection({ blogPosts }: BlogSectionProps) {
  if (!blogPosts || blogPosts.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Related Articles & Guides
          </h2>
          <p className="text-gray-600">
            Learn more about file conversion and best practices
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, idx) => (
            <a
              key={idx}
              href={post.href}
              className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {post.image ? (
                <div className="aspect-[16/10] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                  <div className="text-white/80">
                    <svg
                      className="w-20 h-20 text-white/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <div className="p-6">
                {post.category && (
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                    {post.category}
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {post.subtitle}
                </p>
                <p className="text-sm text-gray-500 line-clamp-3">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold">
                  Read more
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            href="/blog"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View all articles
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
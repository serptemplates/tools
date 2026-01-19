import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type InfoArticleSectionProps = {
  title: string;
  markdown: string;
};

export function InfoArticleSection({
  title,
  markdown,
}: InfoArticleSectionProps) {
  if (!markdown) return null;

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {title}
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-gray-900 mt-6">
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="text-gray-700 leading-relaxed">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-gray-700">{children}</li>,
              a: ({ children, href }) => (
                <a className="text-blue-600 underline" href={href}>
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}

import { Card } from "@serp-tools/ui/components/card";

type FormatInfo = {
  name: string;
  fullName: string;
  description: string;
  details?: string[];
};

type AboutFormatsSectionProps = {
  title?: string;
  fromFormat: FormatInfo;
  toFormat: FormatInfo;
};

export function AboutFormatsSection({
  title,
  fromFormat,
  toFormat,
}: AboutFormatsSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-5xl px-6">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {title}
          </h2>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {/* From Format */}
          <a href={`/files/${fromFormat.name.toLowerCase()}`} className="block">
            <Card className="p-8 border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                  <span className="text-blue-600 font-bold text-lg">
                    {fromFormat.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {fromFormat.name.toUpperCase()} Format
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {fromFormat.fullName}
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                {fromFormat.description}
              </p>
              {fromFormat.details && (
                <ul className="space-y-3">
                  {fromFormat.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </a>

          {/* To Format */}
          <a href={`/files/${toFormat.name.toLowerCase()}`} className="block">
            <Card className="p-8 border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 mb-4">
                  <span className="text-purple-600 font-bold text-lg">
                    {toFormat.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {toFormat.name.toUpperCase()} Format
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {toFormat.fullName}
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                {toFormat.description}
              </p>
              {toFormat.details && (
                <ul className="space-y-3">
                  {toFormat.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </a>
        </div>
      </div>
    </section>
  );
}

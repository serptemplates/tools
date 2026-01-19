import { Card } from "@serp-tools/ui/components/card";

type HowToSectionProps = {
  title: string;
  intro?: string;
  steps: string[];
};

export function HowToSection({ title, intro, steps }: HowToSectionProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
          {intro && <p className="text-gray-600">{intro}</p>}
        </div>
        <ol className="space-y-4">
          {steps.map((step, idx) => (
            <Card
              key={step}
              className="p-6 border-gray-200 bg-white flex items-start gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                {idx + 1}
              </div>
              <p className="text-gray-700 leading-relaxed">{step}</p>
            </Card>
          ))}
        </ol>
      </div>
    </section>
  );
}

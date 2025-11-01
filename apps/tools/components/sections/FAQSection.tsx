"use client";

import { useState } from "react";
import { Card } from "@serp-tools/ui/components/card";

type FAQ = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  faqs: FAQ[];
};

export function FAQSection({ faqs }: FAQSectionProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Everything you need to know about our converter
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card
              key={idx}
              className="p-6 cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg pr-4 text-gray-900">
                  {faq.question}
                </h3>
                <div
                  className={`mt-1 transition-transform duration-200 ${expandedFaq === idx ? "rotate-180" : ""
                    }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {expandedFaq === idx && (
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
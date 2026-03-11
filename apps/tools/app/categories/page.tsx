import Link from "next/link";

import toolsData from "@serp-tools/app-core/data/tools.json";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { buildCategoriesIndexMetadata } from "@/lib/metadata";
import {
  buildToolDirectoryEntries,
  getToolDirectoryCategories,
} from "@/lib/tool-directory";
import type { Tool } from "@/types";

const tools = buildToolDirectoryEntries(toolsData as Tool[]);
const categories = getToolDirectoryCategories(tools);
const activeToolCount = categories.reduce((sum, category) => sum + category.count, 0);

export const metadata = buildCategoriesIndexMetadata();

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_55%),linear-gradient(180deg,_rgba(248,250,252,0.98)_0%,_rgba(255,255,255,1)_100%)]">
        <div className="container py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
              Categories
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Browse Tool Categories
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Jump into every active SERP Tools category and browse the tools available in each
              one.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              {categories.length} categories live now
            </div>
            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
              {activeToolCount} active tools grouped by workflow
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                    {category.name}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {category.title}
                  </h2>
                </div>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                  {category.count}
                </span>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {category.description}
              </p>
              <p className="mt-6 text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                View category
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ToolsLinkHub />
    </main>
  );
}

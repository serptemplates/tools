type FooterLink = {
  href: string;
  label: string;
};

const featuredToolLinks: FooterLink[] = [
  { href: "/", label: "Browse All Tools" },
  { href: "/categories/", label: "Categories" },
  { href: "/video-downloader/", label: "Video Downloader" },
  { href: "/download-loom-videos/", label: "Download Loom Videos" },
  { href: "/pdf-viewer/", label: "PDF Viewer" },
  { href: "/character-counter/", label: "Character Counter" },
];

const networkLinks: FooterLink[] = [
  { href: "https://serp.co", label: "SERP" },
  { href: "https://apps.serp.co", label: "Apps" },
  { href: "https://extensions.serp.co", label: "Extensions" },
  { href: "https://filetypes.serp.co", label: "Filetypes" },
];

function FooterLinkList({
  heading,
  links,
}: Readonly<{
  heading: string;
  links: FooterLink[];
}>) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {heading}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-sm text-slate-200 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="container py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="max-w-xl">
            <a href="/" className="inline-flex items-center text-xl font-semibold tracking-tight text-white">
              SERP Tools
            </a>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-[15px]">
              Free browser-based tools for downloading, converting, compressing, viewing,
              and editing files without slowing down your workflow.
            </p>
          </div>

          <FooterLinkList heading="Popular Tools" links={featuredToolLinks} />
          <FooterLinkList heading="SERP Network" links={networkLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {currentYear} SERP Tools. Built for fast file workflows.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/" className="transition-colors hover:text-white">
              Home
            </a>
            <a href="/categories/" className="transition-colors hover:text-white">
              Categories
            </a>
            <a href="https://apps.serp.co" className="transition-colors hover:text-white">
              Apps
            </a>
            <a href="https://extensions.serp.co" className="transition-colors hover:text-white">
              Extensions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

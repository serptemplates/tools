"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@serp-extensions/ui/components/button";
import { useState } from "react";

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks: Array<{ href: string; label: string; external?: boolean }> = [
    { href: "/categories", label: "Categories" },
    { href: "https://serp.co", label: "SERP", external: true },
    { href: "https://extensions.serp.co", label: "Extensions", external: true },
    { href: "https://tools.serp.co", label: "Tools", external: true },
    { href: "https://apps.serp.co", label: "Apps", external: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">SERP</span>
          </a>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex md:items-center md:space-x-6"
          >
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className={`border-t py-4 md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}
        >
          <div className="space-y-1">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

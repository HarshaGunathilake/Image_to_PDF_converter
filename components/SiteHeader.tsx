"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "#converter", label: "Image to PDF" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,box-shadow] duration-200 ${
        scrolled || open ? "bg-desk/95 shadow-[0_1px_0_var(--rule)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <a
        href="#converter"
        className="sr-only-focusable absolute left-4 top-3 z-50 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-ink shadow-panel"
      >
        Skip to converter
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label={`${site.name} home`} className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-graphite transition-colors hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <a
            href="#converter"
            className="hidden h-9 items-center rounded-lg bg-teal px-4 text-sm font-semibold text-on-teal transition-colors hover:bg-teal-hover sm:inline-flex"
          >
            Convert Images
          </a>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-ink hover:bg-surface md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-rule px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-[15px] font-medium text-ink hover:bg-surface"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#converter"
            onClick={() => setOpen(false)}
            className="mt-2 flex h-11 items-center justify-center rounded-xl bg-teal text-[15px] font-semibold text-on-teal"
          >
            Convert Images
          </a>
        </nav>
      ) : null}
    </header>
  );
}

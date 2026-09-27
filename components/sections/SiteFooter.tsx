import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "../Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-graphite">
            Free image to PDF converter. Files are processed in your browser and never uploaded.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-graphite">
            <li>
              <Link className="hover:text-ink" href="/">
                Image to PDF
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/png-to-pdf">
                PNG to PDF
              </Link>
            </li>
            <li>
              <a className="hover:text-ink" href="#features">
                Features
              </a>
            </li>
            <li>
              <a className="hover:text-ink" href="#privacy">
                Privacy
              </a>
            </li>
            <li>
              <a className="hover:text-ink" href="#faq">
                FAQ
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-graphite sm:px-6">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}

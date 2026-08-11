"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, Tv2 } from "lucide-react";
import { useEffect } from "react";

const navigation = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/providers", label: "Providers", icon: Tv2 },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function isFocusable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  useEffect(() => {
    function onArrowKey(event: KeyboardEvent) {
      if (!event.key.startsWith("Arrow") || window.innerWidth < 1180) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) || active.isContentEditable) return;

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => isFocusable(element) && element !== active);

      const currentRect = active.getBoundingClientRect();
      const currentX = currentRect.left + currentRect.width / 2;
      const currentY = currentRect.top + currentRect.height / 2;
      const direction = event.key.replace("Arrow", "");

      let best: { element: HTMLElement; score: number } | null = null;
      for (const element of focusable) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const dx = x - currentX;
        const dy = y - currentY;
        const inDirection =
          (direction === "Right" && dx > 8) ||
          (direction === "Left" && dx < -8) ||
          (direction === "Down" && dy > 8) ||
          (direction === "Up" && dy < -8);
        if (!inDirection) continue;

        const primary = direction === "Right" || direction === "Left" ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === "Right" || direction === "Left" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 1.8;
        if (!best || score < best.score) best = { element, score };
      }

      if (best) {
        event.preventDefault();
        best.element.focus();
      }
    }

    document.addEventListener("keydown", onArrowKey);
    return () => document.removeEventListener("keydown", onArrowKey);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/" aria-label="FLIXYFY home">
            <span className="brand-mark" aria-hidden="true">F</span>
            <span>FLIXYFY</span>
          </Link>

          <nav className="primary-nav" aria-label="Primary navigation">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname ?? '', href);
              return (
                <Link
                  href={href}
                  key={href}
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <span className="header-copy">Find Indian movies and web series</span>
          <Link className="header-search" href="/search" aria-label="Open search">
            <Search aria-hidden="true" size={18} />
            <span>Search</span>
          </Link>
        </div>
      </header>

      <div id="main-content">{children}</div>

      <nav className="mobile-nav" aria-label="Primary mobile navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname ?? '', href);
          return (
            <Link
              href={href}
              key={href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


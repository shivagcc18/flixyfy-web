"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, Search, Tv2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/providers", label: "Providers", icon: Tv2 },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>("a,button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [drawerOpen]);

  const links = navigation.map(({ href, label, icon: Icon }) => {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        key={href}
        className={active ? "active" : undefined}
        aria-current={active ? "page" : undefined}
        onClick={() => setDrawerOpen(false)}
      >
        <Icon size={17} aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="FLIXYFY home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>FLIXYFY</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">{links}</nav>
        <div className="topbar-actions">
          <span className="topbar-copy">Indian cinema, indexed clearly</span>
          <Link className="topbar-search" href="/search">
            <Search size={16} aria-hidden="true" />
            <span>Search</span>
          </Link>
          <button
            ref={triggerRef}
            className="drawer-trigger"
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="mobile-navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </header>
      {children}
      {drawerOpen ? (
        <div
          className="drawer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDrawerOpen(false);
          }}
        >
          <aside
            ref={drawerRef}
            id="mobile-navigation"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="FLIXYFY navigation"
          >
            <div className="drawer-heading">
              <Link className="brand" href="/" onClick={() => setDrawerOpen(false)}>
                <span className="brand-mark" aria-hidden="true">F</span>
                <span>FLIXYFY</span>
              </Link>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
                <X aria-hidden="true" />
              </button>
            </div>
            <nav className="mobile-nav-list" aria-label="Mobile navigation">{links}</nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

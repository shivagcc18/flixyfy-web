"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Tv2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import FilmReelBackground from "./FilmReelBackground";

const navigation = [
  { href: "/search", label: "Search", desktopLabel: "Search", icon: Search },
  { href: "/providers", label: "Providers", desktopLabel: "Providers", icon: Tv2 },
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
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
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

  const links = navigation.map(({ href, desktopLabel, icon: Icon }) => {
    const active = isActive(pathname, href);
    return (
      <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} onClick={() => setDrawerOpen(false)}>
        <Icon size={17} aria-hidden="true" />
        <span>{desktopLabel}</span>
      </Link>
    );
  });

  return (
    <div className="app-shell">
      <FilmReelBackground />
      <header className="topbar">
        <Link className="brand" href="/" aria-label="FLIXYFY home">
          <img className="brand-logo" src="/flixyfy-logo.png" alt="FLIXYFY" />
          <span className="sr-only">FLIXYFY</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">{links}</nav>
        <Link className="topbar-wordmark" href="/" aria-label="FLIXYFY home">FLIXYFY</Link>
        <div className="topbar-actions">
          <button ref={triggerRef} className="drawer-trigger" type="button" aria-expanded={drawerOpen} aria-controls="mobile-navigation" onClick={() => setDrawerOpen(true)}>
            <Menu aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </header>
      {children}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={18} aria-hidden="true" /><span>{label}</span></Link>;
        })}
      </nav>
      {drawerOpen ? (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }}>
          <aside ref={drawerRef} id="mobile-navigation" className="mobile-drawer" role="dialog" aria-modal="true" aria-label="FLIXYFY navigation">
            <div className="drawer-heading">
              <Link className="brand" href="/" onClick={() => setDrawerOpen(false)}><img className="brand-logo" src="/flixyfy-logo.png" alt="FLIXYFY" /><span className="sr-only">FLIXYFY</span></Link>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X aria-hidden="true" /></button>
            </div>
            <nav className="mobile-nav-list" aria-label="Drawer navigation">{links}</nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

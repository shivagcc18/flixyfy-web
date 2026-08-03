"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Menu,
  Search,
  Tv2,
  X,
} from "lucide-react";
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

function isFocusable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export default function AppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCollapsed(window.localStorage.getItem("flixyfy-sidebar") === "collapsed");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
        drawer.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
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

  useEffect(() => {
    function onArrowKey(event: KeyboardEvent) {
      if (!event.key.startsWith("Arrow") || window.innerWidth < 1700) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) || active.isContentEditable) return;

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
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
        const score = primary + secondary * 2;
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

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "flixyfy-sidebar",
        next ? "collapsed" : "expanded",
      );
      return next;
    });
  }

  const links = navigation.map(({ href, label, icon: Icon }) => (
    <Link
      href={href}
      key={href}
      className={isActive(pathname ?? "", href) ? "active" : undefined}
      aria-current={isActive(pathname ?? "", href) ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={() => setDrawerOpen(false)}
    >
      <Icon aria-hidden="true" size={20} />
      <span className="sidebar-label">{label}</span>
    </Link>
  ));

  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span className="sidebar-label">FLIXYFY</span>
        </Link>
        <nav className="nav-list" aria-label="Explore FLIXYFY">{links}</nav>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
          <span className="sidebar-label">{collapsed ? "Expand" : "Collapse"}</span>
        </button>
        <p className="sidebar-note">
          <Tv2 aria-hidden="true" size={17} />
          <span className="sidebar-label">Real availability data</span>
        </p>
      </aside>
      <div className="main-column">
        <header className="topbar">
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
          <Link className="mobile-brand" href="/">FLIXYFY</Link>
          <span className="topbar-copy">One search. Every movie. Where to watch.</span>
          <Link className="topbar-search" href="/search">
            <Search aria-hidden="true" size={18} />
            <span>Search</span>
          </Link>
        </header>
        {children}
      </div>
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
            <nav className="nav-list" aria-label="Mobile navigation">{links}</nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

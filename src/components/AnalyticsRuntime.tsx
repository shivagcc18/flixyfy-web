"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView } from "@/lib/analytics";

export default function AnalyticsRuntime() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname && lastTrackedPath.current !== pathname) {
      lastTrackedPath.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}

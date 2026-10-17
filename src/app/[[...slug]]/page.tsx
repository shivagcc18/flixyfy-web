import { Suspense } from "react";
import { ClientApp } from "@/components/client-app";

export default function Page() {
  return <Suspense fallback={<main><p className="loading">Loading FLIXYFY…</p></main>}><ClientApp /></Suspense>;
}

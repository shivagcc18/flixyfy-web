import ProviderDirectoryClient from "@/components/ProviderDirectoryClient";

export const metadata = {
  title: "OTT Providers",
  description: "Browse streaming and store providers represented in FLIXYFY's India movie availability catalog.",
  alternates: { canonical: "/providers" },
  openGraph: { title: "OTT Providers | FLIXYFY", url: "https://www.flixyfy.com/providers", type: "website" },
  twitter: { card: "summary", title: "OTT Providers | FLIXYFY" },
};

export default function ProvidersPage() {
  return <ProviderDirectoryClient />;
}

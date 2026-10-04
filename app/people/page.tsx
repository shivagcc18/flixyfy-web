import PeopleLandingClient from "@/components/PeopleLandingClient";

export const metadata = {
  title: "People Directory | FLIXYFY",
  description: "Discover actors, directors, and other people connected to Indian cinema on FLIXYFY.",
  robots: { index: false, follow: true },
};

export default function PeoplePage() {
  return <PeopleLandingClient />;
}

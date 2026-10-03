import PeopleLandingClient from "@/components/PeopleLandingClient";

export const metadata = {
  title: "Cinema Legends | FLIXYFY",
  description: "Explore people connected to Indian cinema across FLIXYFY’s film catalog.",
  robots: { index: false, follow: true },
};

export default function PeoplePage() {
  return <PeopleLandingClient />;
}

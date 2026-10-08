import PersonDetailClient from "@/components/PersonDetailClient";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PersonDetailClient slug={slug} />;
}

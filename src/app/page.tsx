import GlassSidebar from "@/components/layout/GlassSidebar";
import TopNavigation from "@/components/layout/TopNavigation";
import HeroSearch from "@/components/home/HeroSearch";
import DiscoveryChips from "@/components/home/DiscoveryChips";
import MovieRowV2 from "@/components/movie/MovieRowV2";

export default function Home(){
return <main className="min-h-screen bg-[#05070d]">
<GlassSidebar/>
<div className="ml-72">
<TopNavigation/>
<div className="p-8 space-y-12">
<HeroSearch/>
<DiscoveryChips/>
<MovieRowV2 title="Trending Indian Movies"/>
<MovieRowV2 title="Popular Telugu Movies"/>
<MovieRowV2 title="Hindi Dubbed South Movies"/>
</div>
</div>
</main>
}

const chips=["NTR","Prabhas","Netflix","Prime Video","Telugu","Hindi Dubbed","Free YouTube"];

export default function DiscoveryChips(){
return <div className="flex flex-wrap gap-3">
{chips.map(c=><span key={c} className="rounded-full bg-white/10 border border-white/20 px-5 py-3 text-white">{c}</span>)}
</div>
}

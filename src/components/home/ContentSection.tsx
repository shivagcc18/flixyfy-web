export default function ContentSection({title}:{title:string}){
return <section className="space-y-4">
<h2 className="text-2xl font-bold text-white">{title}</h2>
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
{[1,2,3,4,5].map(x=><div key={x} className="h-56 rounded-2xl bg-white/10 border border-white/20" />)}
</div>
</section>
}

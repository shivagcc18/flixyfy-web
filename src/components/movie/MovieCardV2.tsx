export default function MovieCardV2({title="RRR",year="2022",language="Telugu"}:{title?:string;year?:string;language?:string}){
return <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 text-white hover:scale-105 transition">
<div className="h-64 rounded-2xl bg-[#181818]/30 mb-4 flex items-center justify-center">POSTER</div>
<h3 className="text-xl font-bold">{title}</h3>
<p>{year} • {language}</p>
</div>
}

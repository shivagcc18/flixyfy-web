import MovieCardV2 from "./MovieCardV2";

export default function MovieRowV2({title}:{title:string}){
return <section className="space-y-4">
<h2 className="text-2xl font-bold text-white">{title}</h2>
<div className="grid grid-cols-2 md:grid-cols-5 gap-5">
{[1,2,3,4,5].map(x=><MovieCardV2 key={x}/>)}
</div>
</section>
}

import Link from "next/link";

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#070707",color:"#eee",padding:"100px 20px 60px"}}>
      <div style={{width:"min(900px,100%)",margin:"0 auto",border:"1px solid rgba(234,179,8,.22)",borderRadius:20,padding:"clamp(22px,4vw,48px)",background:"rgba(12,12,12,.9)"}}>
        <div style={{color:"#f4d95f",fontWeight:900,letterSpacing:".22em"}}>FLIXYFY</div>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",margin:"8px 0 18px",color:"#fff2a8"}}>Terms of Service</h1>
        <p style={{color:"rgba(255,255,255,.76)",lineHeight:1.75,fontSize:17}}>These terms govern use of the FLIXYFY movie-discovery service and are intentionally conservative pending legal review.</p>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>1. Service purpose</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>FLIXYFY provides search and discovery information about movies, web series, people, streaming availability and third-party watch links. FLIXYFY does not itself host or stream movie video files.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>2. Third-party services</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>Links may open independent OTT, video or other third-party services operating under their own terms, privacy practices and content rights.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>3. Accuracy and changes</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>Availability, metadata and external links can change. Automated and reviewed associations may occasionally be incomplete, inaccurate or outdated.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>4. Responsible use</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>Users must not interfere with the service, attempt unauthorized access, or use FLIXYFY in violation of applicable law or third-party rights.</p>
        </section>
        <p style={{marginTop:34,padding:14,borderLeft:"3px solid #d5a900",background:"rgba(234,179,8,.06)",color:"rgba(255,255,255,.72)",lineHeight:1.65}}>
          This operational page should be reviewed by qualified legal counsel before being treated as final legal advice or a guarantee of statutory protection.
        </p>
        <nav style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:28}}>
          <Link style={{color:"#f4d95f"}} href="/">Back to FLIXYFY</Link>
          <Link style={{color:"#f4d95f"}} href="/copyright">Copyright &amp; Takedown</Link>
          <Link style={{color:"#f4d95f"}} href="/privacy">Privacy</Link>
          <Link style={{color:"#f4d95f"}} href="/terms">Terms</Link>
        </nav>
      </div>
    </main>
  );
}

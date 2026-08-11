import Link from "next/link";

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#070707",color:"#eee",padding:"100px 20px 60px"}}>
      <div style={{width:"min(900px,100%)",margin:"0 auto",border:"1px solid rgba(234,179,8,.22)",borderRadius:20,padding:"clamp(22px,4vw,48px)",background:"rgba(12,12,12,.9)"}}>
        <div style={{color:"#f4d95f",fontWeight:900,letterSpacing:".22em"}}>FLIXYFY</div>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",margin:"8px 0 18px",color:"#fff2a8"}}>Copyright & Takedown</h1>
        <p style={{color:"rgba(255,255,255,.76)",lineHeight:1.75,fontSize:17}}>FLIXYFY respects intellectual-property rights and provides an operational route for reporting inaccurate or problematic third-party links. This page does not claim automatic safe-harbor status.</p>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>1. No hosting</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>FLIXYFY does not host, upload, store or stream movie video files. Watch actions direct users to independent third-party services.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>2. Third-party links</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>OTT providers, YouTube channels, trademarks, logos and third-party content are controlled by their respective owners. Availability and external metadata can change without notice.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>3. Matching</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>FLIXYFY uses structured data, automated matching and review processes. A link, provider association or movie identity may occasionally be inaccurate or outdated.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>4. Rightsholder requests</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>A copyright owner or authorized representative may report an allegedly unauthorized, incorrect or misleading link through the Contact / Report an Issue page. Include the FLIXYFY URL, relevant third-party URL, identification of the work, contact information, explanation of the issue and information supporting your authority to submit the request.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"#f4d95f",fontSize:20,marginBottom:8}}>5. Review</h2>
          <p style={{color:"rgba(255,255,255,.72)",lineHeight:1.75}}>FLIXYFY will review sufficiently complete notices and, where appropriate, remove or disable affected links from its index. No fixed 24–48 hour SLA is promised by this page.</p>
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

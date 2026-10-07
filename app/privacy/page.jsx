import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Read FLIXYFY's current privacy information for its movie discovery service.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#070707",color:"var(--flixyfy-gold-primary)",padding:"100px 20px 60px"}}>
      <div style={{width:"min(900px,100%)",margin:"0 auto",border:"1px solid rgba(220,175,80,.22)",borderRadius:20,padding:"clamp(22px,4vw,48px)",background:"rgba(12,12,12,.9)"}}>
        <div style={{color:"var(--flixyfy-gold-primary)",fontWeight:900,letterSpacing:".22em"}}>FLIXYFY</div>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",margin:"8px 0 18px",color:"var(--flixyfy-gold-highlight)"}}>Privacy Policy</h1>
        <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75,fontSize:17}}>This page states the current high-level privacy posture without inventing production practices that have not been verified.</p>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>1. Data minimization</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>FLIXYFY should collect only information reasonably necessary to operate, secure, improve and measure the service.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>2. Technical information</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>Hosting and analytics systems may receive ordinary technical request information depending on the tools actually enabled in production. Final disclosures must match the deployed configuration.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>3. Future user features</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>Before accounts, corrections, contests, referrals or other personal-data features are enabled, this policy should be updated to reflect those features and applicable user rights.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>4. Third-party links</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>A destination provider or video service processes information under its own privacy policy after the user follows an external link.</p>
        </section>
        <p style={{marginTop:34,padding:14,borderLeft:"3px solid var(--flixyfy-gold-deep)",background:"rgba(220,175,80,.06)",color:"var(--flixyfy-gold-muted)",lineHeight:1.65}}>
          This operational page should be reviewed by qualified legal counsel before being treated as final legal advice or a guarantee of statutory protection.
        </p>
        <nav style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:28}}>
          <Link style={{color:"var(--flixyfy-gold-primary)"}} href="/">Back to FLIXYFY</Link>
          <Link style={{color:"var(--flixyfy-gold-primary)"}} href="/copyright">Copyright &amp; Takedown</Link>
          <Link style={{color:"var(--flixyfy-gold-primary)"}} href="/privacy">Privacy</Link>
          <Link style={{color:"var(--flixyfy-gold-primary)"}} href="/terms">Terms</Link>
        </nav>
      </div>
    </main>
  );
}

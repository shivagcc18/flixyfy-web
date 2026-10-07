import Link from "next/link";

export const metadata = {
  title: "Contact",
  description: "Report a movie identity, availability, third-party link or copyright concern to FLIXYFY.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#070707",color:"var(--flixyfy-gold-primary)",padding:"100px 20px 60px"}}>
      <div style={{width:"min(900px,100%)",margin:"0 auto",border:"1px solid rgba(220,175,80,.22)",borderRadius:20,padding:"clamp(22px,4vw,48px)",background:"rgba(12,12,12,.9)"}}>
        <div style={{color:"var(--flixyfy-gold-primary)",fontWeight:900,letterSpacing:".22em"}}>FLIXYFY</div>
        <h1 style={{fontSize:"clamp(34px,6vw,62px)",margin:"8px 0 18px",color:"var(--flixyfy-gold-highlight)"}}>Contact / Report an Issue</h1>
        <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75,fontSize:17}}>Use this route to report an incorrect movie identity, wrong provider association, problematic YouTube link, copyright concern or other data issue.</p>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>What to include</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>Provide the exact FLIXYFY movie URL, the item involved, a short explanation and any supporting source or rightsholder information that helps verify the correction.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>Rightsholders</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>For copyright concerns, also identify the work, explain your authority to submit the request and provide contact information sufficient for follow-up.</p>
        </section>
        <section style={{marginTop:28}}>
          <h2 style={{color:"var(--flixyfy-gold-primary)",fontSize:20,marginBottom:8}}>Operational contact</h2>
          <p style={{color:"var(--flixyfy-gold-muted)",lineHeight:1.75}}>This patch does not invent a support or copyright email. Connect this page to the verified FLIXYFY support mailbox or reporting form once that channel is operational.</p>
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

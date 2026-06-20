import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  document.title = "About Flixyfy";

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
        <h1>About Flixyfy</h1>

        <p>
          Flixyfy helps users discover where movies are streaming across Indian OTT
          platforms including Netflix, Prime Video, JioHotstar, ZEE5, SonyLIV,
          Aha, Sun NXT and more.
        </p>

        <p>
          Our goal is simple: search a movie once and instantly know where it is
          available to watch.
        </p>
      </div>

      <Footer />
    </>
  );
}
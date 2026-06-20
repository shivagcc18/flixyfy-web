import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Contact() {
  document.title = "Contact Flixyfy";

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
        <h1>Contact</h1>

        <p>
          Questions, feedback, corrections or partnership inquiries can be sent
          to:
        </p>

        <p>
          <strong>shiva.wipro6@gmail.com</strong>
        </p>
      </div>

      <Footer />
    </>
  );
}
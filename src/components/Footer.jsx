import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #222",
        marginTop: "50px",
        padding: "30px 20px",
        textAlign: "center",
        color: "#aaa",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <Link to="/" style={{ color: "#aaa", marginRight: "20px" }}>
          Home
        </Link>

        <Link to="/about" style={{ color: "#aaa", marginRight: "20px" }}>
          About
        </Link>

        <Link to="/contact" style={{ color: "#aaa" }}>
          Contact
        </Link>
      </div>

      <div>© 2026 Flixyfy</div>
    </footer>
  );
}
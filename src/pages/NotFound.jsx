import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#141414",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "72px", margin: 0 }}>404</h1>

      <h2>Page Not Found</h2>

      <p>The page you are looking for does not exist.</p>

      <Link
        to="/"
        style={{
          marginTop: "20px",
          padding: "12px 18px",
          borderRadius: "10px",
          background: "#ec4899",
          color: "#fff",
          textDecoration: "none",
          fontWeight: "700",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
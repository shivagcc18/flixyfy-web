import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function HeroBanner() {
  const [movies, setMovies] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios
      .get(`${API}/api/v2/home`)
      .then((res) => {
        setMovies(res.data["Trending Indian Movies"] || []);
      })
      .catch((err) => {
        console.log("API error:", err);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % 10);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!movies.length) {
    return (
      <div style={{ color: "white", padding: "40px" }}>
        Loading...
      </div>
    );
  }

  const movie = movies[index];

  return (
    <div
      style={{
        height: "85vh",
        position: "relative",
        color: "white",
        display: "flex",
        alignItems: "center",
        padding: "60px",
        backgroundImage: movie.backdrop_url
  ? `linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.2)), url(${movie.backdrop_url})`
  : "linear-gradient(#111, #111)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ maxWidth: "600px" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
          {movie.title}
        </h1>

        <p style={{ fontSize: "16px", opacity: 0.8 }}>
          {movie.overview?.slice(0, 200) || "No description available"}
        </p>

        <div style={{ marginTop: "20px" }}>
          <button style={btnStyle}>▶ Play</button>
          <button style={btnStyleSecondary}>ℹ More Info</button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 20px",
  marginRight: "10px",
  background: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnStyleSecondary = {
  padding: "10px 20px",
  background: "rgba(109,109,110,0.7)",
  color: "white",
  border: "none",
  cursor: "pointer",
};
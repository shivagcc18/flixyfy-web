// ==============================
// ⭐ RecommendationRow.jsx
// VERSION: V1.1 (PRODUCTION READY)
// ==============================

import { useEffect, useState } from "react";
import { getMovieById } from "../api/movies";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function RecommendationRow({ movieId }) {
    const [movie, setMovie] = useState(null);
    const [recs, setRecs] = useState([]);

    // ==============================
    // ⭐ LOAD RECOMMENDATIONS
    // ==============================
    const loadRecommendations = async (id) => {
        try {
            if (!id) return;

            // ⭐ STEP 1: get recommendation list
            const res = await axios.get(`${API}/recommend/${id}`);

            const recList = res.data.results || [];
            setRecs(recList);

        } catch (err) {
            console.log("Recommendation error:", err);
            setRecs([]);
        }
    };

    // ==============================
    // ⭐ LOAD BASE MOVIE (OPTIONAL)
    // ==============================
    const loadMovie = async (id) => {
        try {
            const data = await getMovieById(id);
            setMovie(data);
        } catch (err) {
            console.log("Movie load error:", err);
        }
    };

    // ==============================
    // ⭐ INIT
    // ==============================
    useEffect(() => {
        if (movieId) {
            loadMovie(movieId);
            loadRecommendations(movieId);
        }
    }, [movieId]);

    return (
        <div style={{ padding: "20px", color: "white" }}>

            {/* ========================= */}
            {/* ⭐ HEADER SECTION */}
            {/* ========================= */}
            <h2 style={{ marginBottom: "10px" }}>
                🔥 Because you watched
            </h2>

            {movie && (
                <p style={{ color: "gray" }}>
                    {movie.title}
                </p>
            )}

            {/* ========================= */}
            {/* ⭐ ROW UI (HORIZONTAL SCROLL) */}
            {/* ========================= */}
            <div
                style={{
                    display: "flex",
                    overflowX: "auto",
                    gap: "12px",
                    paddingBottom: "10px"
                }}
            >
                {recs.map((m, i) => (
                    <div
                        key={m.id || i}
                        style={{
                            minWidth: "180px",
                            background: "#222",
                            padding: "10px",
                            borderRadius: "10px",
                            cursor: "pointer"
                        }}
                    >
                        {/* Poster placeholder (future upgrade) */}
                        <div style={{
                            height: "100px",
                            background: "#444",
                            borderRadius: "6px",
                            marginBottom: "8px"
                        }} />

                        <h4 style={{ fontSize: "14px" }}>
                            {m.title}
                        </h4>

                        <p style={{ fontSize: "12px", color: "gold" }}>
                            ⭐ {m.imdb_rating}
                        </p>

                        <p style={{ fontSize: "12px", color: "gray" }}>
                            Score: {m.score}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
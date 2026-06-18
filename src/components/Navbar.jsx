import { useEffect, useState } from "react";

export default function Navbar({ onSearch }) {

    const [query, setQuery] = useState("");

    // ⭐ LIVE SEARCH TRIGGER
    useEffect(() => {
        if (!onSearch) return;

        const trimmed = query.trim();

        const timeout = setTimeout(() => {
            onSearch(trimmed);
        }, 500); // debounce delay

        return () => clearTimeout(timeout);

    }, [query]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSearch(query.trim());
        }
    };

    return (
        <div
            style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 28px",
                background: "rgba(20, 20, 20, 0.75)",
                backdropFilter: "blur(10px)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "white"
            }}
        >

            {/* ⭐ LOGO */}
            <h2 style={{ color: "#e50914", margin: 0 }}>
                OTT FLIX
            </h2>

            {/* ⭐ SEARCH */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    background: "rgba(255,255,255,0.08)",
                    padding: "6px 10px",
                    borderRadius: "10px"
                }}
            >
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search movies, series..."
                    style={{
                        width: "260px",
                        padding: "10px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "white"
                    }}
                />
            </div>

        </div>
    );
}
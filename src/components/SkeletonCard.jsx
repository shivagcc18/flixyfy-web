export default function SkeletonCard() {
    return (
        <div
            style={{
                minWidth: "160px",
                height: "260px",
                borderRadius: "10px",
                background: "#1a1a1a",
                position: "relative",
                overflow: "hidden"
            }}
        >

            {/* ⭐ SHIMMER EFFECT */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "-150%",
                    width: "150%",
                    height: "100%",
                    background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    animation: "shimmer 1.2s infinite"
                }}
            />

            {/* ⭐ TEXT PLACEHOLDERS */}
            <div
                style={{
                    position: "absolute",
                    bottom: 10,
                    left: 10,
                    right: 10
                }}
            >
                <div
                    style={{
                        height: "10px",
                        background: "#2a2a2a",
                        marginBottom: "8px",
                        borderRadius: "4px"
                    }}
                />
                <div
                    style={{
                        height: "8px",
                        width: "60%",
                        background: "#2a2a2a",
                        borderRadius: "4px"
                    }}
                />
            </div>
        </div>
    );
}
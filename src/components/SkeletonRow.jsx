import "./MovieCard.css";

export default function SkeletonRow() {
  return (
    <section className="movie-section">
      <div className="movie-row">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="movie-card-skeleton" key={index}>
            <div className="skeleton-poster" />
            <div className="skeleton-line long" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </section>
  );
}
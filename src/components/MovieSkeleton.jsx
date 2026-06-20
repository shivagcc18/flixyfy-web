import "./MovieCard.css";

export default function MovieSkeleton() {
  return (
    <div className="movie-card-skeleton">
      <div className="skeleton-poster" />
      <div className="skeleton-line long" />
      <div className="skeleton-line short" />
    </div>
  );
}
import { useRef } from "react";
import MovieCard from "./MovieCard";
import "./Row.css";

export default function Row({ title, movies }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const isDragging = useRef(false);
  const moved = useRef(false);

  if (!movies || movies.length === 0) return null;

  function onTouchStart(e) {
    const row = rowRef.current;
    if (!row) return;

    isDragging.current = true;
    moved.current = false;
    startX.current = e.touches[0].clientX;
    startScrollLeft.current = row.scrollLeft;
  }

  function onTouchMove(e) {
    const row = rowRef.current;
    if (!row || !isDragging.current) return;

    const x = e.touches[0].clientX;
    const walk = (startX.current - x) * 1.2;

    if (Math.abs(walk) > 5) {
      moved.current = true;
    }

    row.scrollLeft = startScrollLeft.current + walk;
  }

  function onTouchEnd() {
    isDragging.current = false;
  }

  function onClickCapture(e) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <section className="movie-section">
      <h2 className="section-title">{title}</h2>

      <div
        ref={rowRef}
        className="movie-row"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.tmdb_id || movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}
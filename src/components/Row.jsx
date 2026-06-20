import { useRef } from "react";
import MovieCard from "./MovieCard";

export default function Row({ title, movies }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  if (!movies || movies.length === 0) return null;

  function onTouchStart(e) {
    const row = rowRef.current;
    if (!row) return;

    startX.current = e.touches[0].pageX;
    startScrollLeft.current = row.scrollLeft;
    moved.current = false;
  }

  function onTouchMove(e) {
    const row = rowRef.current;
    if (!row) return;

    const x = e.touches[0].pageX;
    const walk = startX.current - x;

    if (Math.abs(walk) > 5) {
      moved.current = true;
      row.scrollLeft = startScrollLeft.current + walk;
    }
  }

  function onClickCapture(e) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <section>
      <h2 className="section-title">{title}</h2>

      <div
        ref={rowRef}
        className="movie-row"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClickCapture={onClickCapture}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.tmdb_id || movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}
import { useRef } from "react";
import MovieCard from "./MovieCard";
import "./Row.css";

export default function Row({ title, movies = [] }) {
  const rowRef = useRef(null);
  const drag = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const onPointerDown = (e) => {
    const row = rowRef.current;
    if (!row) return;

    drag.current.isDown = true;
    drag.current.startX = e.clientX;
    drag.current.scrollLeft = row.scrollLeft;
    drag.current.moved = false;

    row.classList.add("is-dragging");
    row.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const row = rowRef.current;
    if (!row || !drag.current.isDown) return;

    const dx = e.clientX - drag.current.startX;

    if (Math.abs(dx) > 5) {
      drag.current.moved = true;
    }

    row.scrollLeft = drag.current.scrollLeft - dx;
  };

  const stopDrag = (e) => {
    const row = rowRef.current;
    if (!row) return;

    drag.current.isDown = false;
    row.classList.remove("is-dragging");

    try {
      row.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  if (!movies.length) return null;

  return (
    <section className="movie-section">
      {title && <h2 className="section-title">{title}</h2>}

      <div
        ref={rowRef}
        className="movie-row"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
        onClickCapture={onClickCapture}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.tmdb_id || movie.id || movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}
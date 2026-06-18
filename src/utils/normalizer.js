export const normalizeMovie = (movie) => ({
  title: movie.title || "Unknown Title",
  year: movie.year || "N/A",

  imdb_rating: movie.imdb_rating || movie.rating || "N/A",

  ott_platforms:
    Array.isArray(movie.ott_platforms) && movie.ott_platforms.length > 0
      ? movie.ott_platforms
      : movie.ott
      ? [movie.ott]
      : ["Not Available"],

  poster_url: movie.poster_url || "/placeholder.jpg"
});
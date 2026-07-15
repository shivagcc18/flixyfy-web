import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";
import API_BASE from "../config/api";
import { setPageSeo } from "../utils/seo";
import "./HistoricalPeoplePage.css";

const PEOPLE_ROW_LIMIT = 25;
const PEOPLE_SEARCH_LIMIT = 72;

const LANGUAGE_ROWS = [
  { key: "popular", title: "Popular Historical People", language: "", minMovies: 50 },
  { key: "hi", title: "Hindi Historical People", language: "hi", minMovies: 25 },
  { key: "te", title: "Telugu Historical People", language: "te", minMovies: 25 },
  { key: "ta", title: "Tamil Historical People", language: "ta", minMovies: 25 },
  { key: "kn", title: "Kannada Historical People", language: "kn", minMovies: 20 },
  { key: "ml", title: "Malayalam Historical People", language: "ml", minMovies: 20 },
];

const LANGUAGE_ALIASES = {
  hi: ["hi", "hindi"],
  te: ["te", "telugu"],
  ta: ["ta", "tamil"],
  kn: ["kn", "kannada"],
  ml: ["ml", "malayalam"],
};

function roleLabel(value) {
  const text = String(value || "film person").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstNumber(values, fallback = 0) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return fallback;
}

function cleanLanguageName(value) {
  const text = String(value || "").trim();
  if (!text) return "Language";
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function getPrimaryMovieCount(person, responseData, total) {
  return firstNumber(
    [
      person?.primary_language_movie_count,
      responseData?.primary_language_movie_count,
      person?.movie_count,
      responseData?.total,
      total,
    ],
    0
  );
}

function getCareerMovieCount(person, responseData, primaryCount) {
  return firstNumber(
    [
      person?.career_attached_movie_count,
      responseData?.career_attached_movie_count,
      person?.career_movie_count,
      primaryCount,
    ],
    primaryCount
  );
}

function personName(person) {
  return (
    person?.person_name ||
    person?.display_name ||
    person?.name ||
    person?.title ||
    "Person"
  );
}

function personSlug(person) {
  return (
    person?.person_slug ||
    person?.slug ||
    String(personName(person)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
}

function normalizeImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `https://image.tmdb.org/t/p/w342${raw}`;
  return raw;
}

function personImage(person) {
  return normalizeImageUrl(
    person?.profile_url ||
      person?.profile_image_url ||
      person?.profile_path ||
      person?.poster_url ||
      person?.image_url ||
      person?.photo_url ||
      person?.avatar_url
  );
}

function personInitials(person) {
  return personName(person)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function personLanguageText(person) {
  return [
    person?.primary_language_slug,
    person?.primary_language_name,
    person?.language_slug,
    person?.language_name,
    person?.primary_language,
    person?.language,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(" ");
}

function filterPeopleByLanguage(items, language) {
  if (!language) return items;
  const aliases = LANGUAGE_ALIASES[language] || [language];
  const hasLanguageData = items.some((person) => personLanguageText(person));
  if (!hasLanguageData) return items;

  return items.filter((person) => {
    const text = personLanguageText(person);
    return aliases.some((alias) => text.includes(alias));
  });
}

async function fetchHistoricalPeople({ query = "", language = "", limit = PEOPLE_ROW_LIMIT, minMovies = 20 }) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("min_movies", String(minMovies));

  if (query.trim()) params.set("q", query.trim());
  if (language) params.set("language", language);

  const response = await fetch(`${API_BASE}/api/v4/historical/people?${params.toString()}`);
  if (!response.ok) throw new Error(`People API failed: ${response.status}`);

  const data = await response.json();
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = filterPeopleByLanguage(rawItems, language).slice(0, limit);

  return {
    items,
    total: safeNumber(data.total, rawItems.length || items.length),
  };
}

function PersonStats({ person, responseData, total }) {
  const pageMovieCount = getPrimaryMovieCount(person, responseData, total);
  const careerMovieCount = getCareerMovieCount(person, responseData, pageMovieCount);

  const languageName = cleanLanguageName(
    person?.primary_language_name || person?.primary_language_slug || responseData?.language
  );

  return (
    <div className="historical-people-stats">
      <span>
        {pageMovieCount} {languageName} movies
      </span>

      {careerMovieCount > pageMovieCount && (
        <span>{careerMovieCount} total mapped movies</span>
      )}

      <span>{safeNumber(person?.youtube_movie_count)} with YouTube</span>
      <span>{roleLabel(person?.primary_role)}</span>
    </div>
  );
}

function PersonPosterCard({ person }) {
  const name = personName(person);
  const slug = personSlug(person);
  const image = personImage(person);
  const movieCount = safeNumber(person?.movie_count || person?.primary_language_movie_count);
  const youtubeCount = safeNumber(person?.youtube_movie_count);
  const role = roleLabel(person?.primary_role);

  return (
    <Link className="historical-person-poster-card" to={`/historical/person/${slug}`}>
      <div className="historical-person-poster-frame">
        {image ? (
          <img src={image} alt={name} loading="lazy" decoding="async" />
        ) : (
          <div className="historical-person-initials" aria-hidden="true">
            {personInitials(person)}
          </div>
        )}
      </div>

      <div className="historical-person-card-body">
        <h3>{name}</h3>
        <p>{role}</p>
        <span>
          {movieCount} movies
          {youtubeCount ? ` • ${youtubeCount} YouTube` : ""}
        </span>
      </div>
    </Link>
  );
}

function PeopleRow({ title, people, total }) {
  if (!people?.length) return null;

  return (
    <section className="historical-people-row-section">
      <div className="historical-people-row-heading">
        <h2>{title} ({total || people.length})</h2>
        <p>Showing {Math.min(people.length, PEOPLE_ROW_LIMIT)} of {total || people.length}</p>
      </div>

      <div className="historical-people-card-row">
        {people.slice(0, PEOPLE_ROW_LIMIT).map((person) => (
          <PersonPosterCard person={person} key={personSlug(person)} />
        ))}
      </div>
    </section>
  );
}

export function HistoricalPersonPage({ mode = "historical" }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const isUnified = mode === "unified";
  const languageParam = searchParams.get("language") || searchParams.get("lang") || "telugu";

  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [responseData, setResponseData] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const title = useMemo(() => {
    if (person?.page_title) return person.page_title;
    if (person?.person_name) return `${person.person_name} Movies`;
    if (person?.display_name) return `${person.display_name} Movies`;
    return isUnified ? "Person Movies" : "Historical Person Movies";
  }, [person, isUnified]);

  useEffect(() => {
    let cancelled = false;

    async function loadPerson() {
      try {
        setLoading(true);
        setError("");

        const apiPath = isUnified ? "person" : "historical/person";
        const params = new URLSearchParams();
        params.set("limit", "160");

        if (isUnified) {
          params.set("language", languageParam);
        }

        const res = await fetch(
          `${API_BASE}/api/v4/${apiPath}/${encodeURIComponent(slug)}?${params.toString()}`
        );

        if (!res.ok) throw new Error(`Person API failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        const nextPerson = data.person || null;
        const nextMovies = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.primary_language_filmography)
            ? data.primary_language_filmography
            : Array.isArray(data.movies)
              ? data.movies
              : [];

        const nextTotal = getPrimaryMovieCount(
          nextPerson,
          data,
          data.total || nextMovies.length || 0
        );

        setPerson(nextPerson);
        setMovies(nextMovies);
        setResponseData(data);
        setTotal(nextTotal);

        setPageSeo({
          title:
            nextPerson?.seo_title ||
            nextPerson?.meta_title ||
            nextPerson?.page_title ||
            `${nextPerson?.person_name || nextPerson?.display_name || "Person"} Movies`,
          description:
            nextPerson?.meta_description ||
            nextPerson?.page_summary ||
            "Explore Indian filmography, roles, and YouTube full movie links where available.",
          path: isUnified ? `/person/${slug}` : `/historical/person/${slug}`,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Historical person API failed:", err);
        setError("Person page is not available yet.");
        setPerson(null);
        setMovies([]);
        setResponseData(null);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPerson();

    return () => {
      cancelled = true;
    };
  }, [slug, isUnified, languageParam]);

  return (
    <div className="historical-people-page historical-person-detail-page">
      <Navbar />
      <main>
        <section className="historical-person-detail-hero">
          <Link className="historical-people-back" to="/historical/people">
            {isUnified ? "People" : "Historical People"}
          </Link>

          <h1>{title}</h1>

          {(person?.page_summary || person?.meta_description) && (
            <p>{person.page_summary || person.meta_description}</p>
          )}

          {person && (
            <PersonStats person={person} responseData={responseData} total={total} />
          )}
        </section>

        <section className="historical-people-results">
          <h2>{loading ? "Loading..." : `Movies (${total || movies.length})`}</h2>

          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-people-empty">{error}</p>
          ) : movies.length === 0 ? (
            <p className="historical-people-empty">No movies found for this person.</p>
          ) : (
            <MovieGrid movies={movies} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function HistoricalPeoplePage() {
  const [rows, setRows] = useState([]);
  const [searchResults, setSearchResults] = useState({ items: [], total: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cleanQuery = query.trim();

  useEffect(() => {
    setPageSeo({
      title: "Historical Indian Movie People",
      description:
        "Explore classic Indian actors, directors, producers, music directors, filmographies, and watch links on Flixyfy.",
      path: "/historical/people",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      try {
        setLoading(true);
        setError("");

        if (cleanQuery) {
          const searchData = await fetchHistoricalPeople({
            query: cleanQuery,
            limit: PEOPLE_SEARCH_LIMIT,
            minMovies: 5,
          });

          if (cancelled) return;
          setSearchResults(searchData);
          setRows([]);
          return;
        }

        const nextRows = await Promise.all(
          LANGUAGE_ROWS.map(async (row) => {
            const data = await fetchHistoricalPeople({
              language: row.language,
              limit: PEOPLE_ROW_LIMIT,
              minMovies: row.minMovies,
            });

            return {
              ...row,
              people: data.items,
              total: data.total,
            };
          })
        );

        if (cancelled) return;
        setRows(nextRows.filter((row) => row.people?.length));
        setSearchResults({ items: [], total: 0 });
      } catch (err) {
        if (cancelled) return;
        console.error("Historical people API failed:", err);
        setError("People list is not available yet.");
        setRows([]);
        setSearchResults({ items: [], total: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(loadPeople, 180);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cleanQuery]);

  return (
    <div className="historical-people-page">
      <Navbar />
      <main>
        <section className="historical-people-controls-v2">
          <div className="historical-people-tabs-v2">
            <Link to="/historical">Movies</Link>
            <Link to="/historical/combinations">Combinations</Link>
          </div>

          <form className="historical-people-search-shell" onSubmit={(event) => event.preventDefault()}>
            <input
              className="historical-people-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search historical people..."
              aria-label="Search historical people"
            />
            <button type="submit">Search</button>
          </form>
        </section>

        <section className="historical-people-results-v2">
          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-people-empty">{error}</p>
          ) : cleanQuery ? (
            <>
              <div className="historical-people-row-heading">
                <h2>People Search Results ({searchResults.total || searchResults.items.length})</h2>
                <p>Showing {searchResults.items.length} of {searchResults.total || searchResults.items.length}</p>
              </div>

              {searchResults.items.length === 0 ? (
                <p className="historical-people-empty">No people found.</p>
              ) : (
                <div className="historical-people-search-grid">
                  {searchResults.items.map((person) => (
                    <PersonPosterCard person={person} key={personSlug(person)} />
                  ))}
                </div>
              )}
            </>
          ) : rows.length === 0 ? (
            <p className="historical-people-empty">No people found.</p>
          ) : (
            rows.map((row) => (
              <PeopleRow
                key={row.key}
                title={row.title}
                people={row.people}
                total={row.total}
              />
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

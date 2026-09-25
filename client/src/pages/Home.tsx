import { useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import api from "../api/api";

import type { Movie, Showtime } from "../types";

import MovieCard from "../components/MovieCard";

import PosterImage from "../components/PosterImage";

import Loading from "../components/Loading";

import { getTheaterPlace } from "../utils/showtime";

import { posterGradient } from "../utils/posterColor";

import { useSelectedPlace } from "../hooks/useSelectedPlace";

// ---------------------------------------------
// HERO BANNER (auto-rotating featured movies)
// ---------------------------------------------

const HeroBanner = ({ movies }: { movies: Movie[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (movies.length < 2) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % movies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [movies.length]);

  if (movies.length === 0) return null;

  const movie = movies[index % movies.length];

  const genre = Array.isArray(movie.genre)
    ? movie.genre.join(" / ")
    : movie.genre;

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: posterGradient(movie.title) }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="rounded bg-[#f84464] px-3 py-1 text-xs font-bold tracking-wider">
            NOW SHOWING
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            {movie.title}
          </h1>

          <p className="mt-3 text-sm text-slate-200 sm:text-base">
            {[genre, movie.language, movie.duration && `${movie.duration} min`]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {movie.description && (
            <p className="mt-3 line-clamp-2 max-w-xl text-sm text-slate-300">
              {movie.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Link
              to={`/movies/${movie._id}`}
              className="rounded-lg bg-[#f84464] px-8 py-3 font-semibold text-white transition hover:bg-[#e63a58]"
            >
              Book tickets
            </Link>

            {movie.rating ? (
              <span className="font-semibold">
                <span className="text-[#f84464]">★</span> {movie.rating}/10
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden shrink-0 md:block">
          <PosterImage
            movie={movie}
            className="h-64 w-44 rotate-3 rounded-xl object-cover shadow-2xl ring-4 ring-white/20"
          />
        </div>
      </div>

      {movies.length > 1 && (
        <div className="relative flex justify-center gap-2 pb-4">
          {movies.map((item, dot) => (
            <button
              key={item._id}
              onClick={() => setIndex(dot)}
              aria-label={`Show ${item.title}`}
              className={`h-2 rounded-full transition-all ${dot === index % movies.length
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50"
                }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------
// HOME PAGE
// ---------------------------------------------

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  const [showtimes, setShowtimes] = useState<Showtime[]>([]);

  const [loading, setLoading] = useState(true);

  // The navbar search box sends the text as /?q=...
  const [searchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const [genre, setGenre] = useState("All");

  const [language, setLanguage] = useState("All");

  const [place, setPlace] = useSelectedPlace();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/movies");

        const data =
          response.data.movies || response.data.data || response.data;

        setMovies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }

      // Showtimes are only used for the city filter,
      // so a failure here must not break the movie list.
      try {
        const response = await api.get("/showtimes");

        const data =
          response.data.showtimes || response.data.data || response.data;

        setShowtimes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching showtimes:", error);
      }
    };

    fetchData();
  }, []);

  const genres = [
    "All",

    ...Array.from(
      new Set(
        movies.flatMap((movie) => {
          if (Array.isArray(movie.genre)) {
            return movie.genre;
          }

          return movie.genre ? [movie.genre] : [];
        })
      )
    ),
  ];

  const languages = [
    "All",

    ...Array.from(
      new Set(
        movies.map((movie) => movie.language).filter((item): item is string => !!item)
      )
    ),
  ];

  // Cities come from the theaters that have showtimes
  const places = useMemo(() => {
    const found = new Set<string>();

    showtimes.forEach((showtime) => {
      const name = getTheaterPlace(showtime.theater);

      if (name) found.add(name);
    });

    return ["All", ...Array.from(found).sort()];
  }, [showtimes]);

  const activePlace = places.includes(place) ? place : "All";

  // Ids of movies that are showing at theaters in the chosen city
  const movieIdsInPlace = useMemo(() => {
    if (activePlace === "All") return null;

    const ids = new Set<string>();

    showtimes.forEach((showtime) => {
      if (getTheaterPlace(showtime.theater) !== activePlace) return;

      const movieId =
        typeof showtime.movie === "string"
          ? showtime.movie
          : showtime.movie?._id;

      if (movieId) ids.add(movieId);
    });

    return ids;
  }, [showtimes, activePlace]);

  const filteredMovies = movies.filter((movie) => {
    const titleMatch = movie.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const movieGenres = Array.isArray(movie.genre)
      ? movie.genre
      : [movie.genre];

    const genreMatch = genre === "All" || movieGenres.includes(genre);

    const languageMatch = language === "All" || movie.language === language;

    const placeMatch = !movieIdsInPlace || movieIdsInPlace.has(movie._id);

    return titleMatch && genreMatch && languageMatch && placeMatch;
  });

  // Highest rated movies are featured in the banner
  const featured = useMemo(
    () =>
      [...movies]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5),
    [movies]
  );

  if (loading) {
    return <Loading />;
  }

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${active
      ? "border-[#f84464] bg-[#f84464] text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-[#f84464] hover:text-[#f84464]"
    }`;

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <HeroBanner movies={featured} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SEARCH + CITY */}

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search for movies"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-white py-3 pl-11 pr-5 outline-none transition focus:border-[#f84464] focus:ring-2 focus:ring-[#f84464]/20"
            />
          </div>

          {places.length > 1 && (
            <select
              value={activePlace}
              onChange={(e) => setPlace(e.target.value)}
              aria-label="City"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 outline-none focus:border-[#f84464] md:w-56"
            >
              {places.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "📍 All cities" : `📍 ${item}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* FILTER CHIPS */}

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <span className="w-16 shrink-0 text-sm font-semibold text-slate-500">
              Genre
            </span>

            {genres.map((item) => (
              <button
                key={item}
                onClick={() => setGenre(item)}
                className={chip(genre === item)}
              >
                {item}
              </button>
            ))}
          </div>

          {languages.length > 2 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              <span className="w-16 shrink-0 text-sm font-semibold text-slate-500">
                Language
              </span>

              {languages.map((item) => (
                <button
                  key={item}
                  onClick={() => setLanguage(item)}
                  className={chip(language === item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MOVIES */}

        <div className="mt-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[#1f2533]">
            Recommended Movies
            {activePlace !== "All" && (
              <span className="ml-2 text-base font-medium text-slate-500">
                in {activePlace}
              </span>
            )}
          </h2>

          <span className="text-sm text-slate-500">
            {filteredMovies.length} movies
          </span>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white py-20 text-center shadow-sm">
            <p className="text-xl font-semibold text-[#1f2533]">
              No movies found 🎬
            </p>

            <p className="mt-2 text-slate-500">
              Try a different search, genre or city.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import type { Movie, Showtime } from "../types";
import Loading from "../components/Loading";
import PosterImage from "../components/PosterImage";
import {
  clockToMinutes,
  formatClock,
  formatScreen,
  formatShowDate,
  formatTheaterLocation,
  getDateKey,
  getTheaterPlace,
} from "../utils/showtime";
import { posterGradient } from "../utils/posterColor";
import { useSelectedPlace } from "../hooks/useSelectedPlace";

type TheaterGroup = {
  key: string;
  name: string;
  location: string;
  showtimes: Showtime[];
};

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useSelectedPlace();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const movieResponse = await api.get(`/movies/${id}`);

        const movieData =
          movieResponse.data.movie ||
          movieResponse.data.data ||
          movieResponse.data;

        setMovie(movieData);

        const showtimeResponse = await api.get("/showtimes");

        const allShowtimes =
          showtimeResponse.data.showtimes ||
          showtimeResponse.data.data ||
          showtimeResponse.data;

        const filtered = Array.isArray(allShowtimes)
          ? allShowtimes.filter((showtime: Showtime) => {
            if (typeof showtime.movie === "string") {
              return showtime.movie === id;
            }

            return showtime.movie?._id === id;
          })
          : [];

        setShowtimes(filtered);
      } catch (error) {
        console.error("Movie details error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const getShowDate = (showtime: Showtime) =>
    showtime.showDate || showtime.date;

  // The Showtime model stores the time in "startTime"
  const getStart = (showtime: Showtime) =>
    showtime.startTime || showtime.showTime || showtime.time;

  // Cities of the theaters showing this movie
  const places = useMemo(() => {
    const found = new Set<string>();

    showtimes.forEach((showtime) => {
      const name = getTheaterPlace(showtime.theater);

      if (name) found.add(name);
    });

    return ["All", ...Array.from(found).sort()];
  }, [showtimes]);

  const activePlace = places.includes(place) ? place : "All";

  const visibleShowtimes = useMemo(() => {
    if (activePlace === "All") return showtimes;

    return showtimes.filter(
      (showtime) => getTheaterPlace(showtime.theater) === activePlace
    );
  }, [showtimes, activePlace]);

  const availableDates = useMemo(() => {
    const dates = visibleShowtimes
      .map((showtime) => getDateKey(getShowDate(showtime)))
      .filter(Boolean);

    return Array.from(new Set(dates)).sort();
  }, [visibleShowtimes]);

  // Keep a valid date selected (first date, or after changing the city)
  useEffect(() => {
    if (availableDates.length === 0) {
      if (selectedDate) setSelectedDate("");

      return;
    }

    if (!availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Theaters and their showtimes (sorted by time) for the selected date
  const groups = useMemo((): TheaterGroup[] => {
    const map = new Map<string, TheaterGroup>();

    visibleShowtimes
      .filter((showtime) => getDateKey(getShowDate(showtime)) === selectedDate)
      .forEach((showtime) => {
        const theater =
          typeof showtime.theater === "string" ? null : showtime.theater;

        const key =
          typeof showtime.theater === "string"
            ? showtime.theater
            : showtime.theater?._id || "theater";

        if (!map.has(key)) {
          map.set(key, {
            key,
            name: theater?.name || "Theater",
            location: formatTheaterLocation(theater),
            showtimes: [],
          });
        }

        map.get(key)!.showtimes.push(showtime);
      });

    const result = Array.from(map.values());

    result.forEach((group) =>
      group.showtimes.sort(
        (a, b) => clockToMinutes(getStart(a)) - clockToMinutes(getStart(b))
      )
    );

    return result;
  }, [visibleShowtimes, selectedDate]);

  if (loading) {
    return <Loading />;
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Movie not found</h2>

        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-lg bg-[#f84464] px-6 py-3 font-semibold text-white"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  const genres = Array.isArray(movie.genre) ? movie.genre : [movie.genre];

  const dateParts = (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`);

    return {
      weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
      day: date.toLocaleDateString("en-IN", { day: "numeric" }),
      month: date.toLocaleDateString("en-IN", { month: "short" }),
    };
  };

  // Green = available, orange = filling fast, red = almost full
  const slotTone = (showtime: Showtime) => {
    const left = showtime.availableSeats;

    if (typeof left === "number" && left <= 0) {
      return "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300";
    }

    const ratio =
      typeof left === "number" && showtime.totalSeats
        ? left / showtime.totalSeats
        : 1;

    if (ratio <= 0.1) {
      return "border-[#f84464] text-[#f84464] hover:bg-[#f84464] hover:text-white";
    }

    if (ratio <= 0.5) {
      return "border-[#ffa000] text-[#ffa000] hover:bg-[#ffa000] hover:text-white";
    }

    return "border-[#4abd5d] text-[#4abd5d] hover:bg-[#4abd5d] hover:text-white";
  };

  const chip =
    "rounded-md bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur";

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* MOVIE HEADER */}

      <section
        className="relative text-white"
        style={{ background: posterGradient(movie.title) }}
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="mx-auto w-52 shrink-0 overflow-hidden rounded-xl shadow-2xl md:mx-0 md:w-64">
              <PosterImage
                movie={movie}
                className="aspect-2/3 w-full object-cover"
              />

              <div className="bg-black/80 py-1.5 text-center text-xs font-semibold tracking-wide">
                IN CINEMAS
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-extrabold sm:text-5xl">
                {movie.title}
              </h1>

              <div className="mt-4 inline-flex w-fit items-center gap-3 rounded-lg bg-black/60 px-4 py-2">
                <span className="text-xl text-[#f84464]">★</span>

                <span className="text-lg font-bold">
                  {movie.rating ? `${movie.rating}/10` : "New"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {movie.language && <span className={chip}>{movie.language}</span>}

                {movie.duration ? (
                  <span className={chip}>{movie.duration} min</span>
                ) : null}

                {genres.filter(Boolean).map((item) => (
                  <span key={item} className={chip}>
                    {item}
                  </span>
                ))}
              </div>

              {movie.releaseDate && (
                <p className="mt-3 text-sm text-slate-200">
                  Released on {formatShowDate(movie.releaseDate)}
                </p>
              )}

              <p className="mt-4 max-w-2xl leading-7 text-slate-200">
                {movie.description ||
                  "Book your tickets and enjoy this movie in your favorite theater."}
              </p>

              <button
                onClick={() =>
                  document
                    .getElementById("showtimes")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="mt-6 w-fit rounded-lg bg-[#f84464] px-10 py-3 font-semibold text-white transition hover:bg-[#e63a58]"
              >
                Book tickets
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DATE STRIP */}

      <div
        id="showtimes"
        className="sticky top-0 z-10 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {availableDates.length === 0 ? (
            <span className="py-2 text-sm text-slate-500">
              No dates available
            </span>
          ) : (
            availableDates.map((date) => {
              const active = selectedDate === date;

              const parts = dateParts(date);

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex min-w-16 flex-col items-center rounded-lg px-3 py-2 transition ${active
                      ? "bg-[#f84464] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <span className="text-[11px] font-medium uppercase">
                    {parts.weekday}
                  </span>

                  <span className="text-xl font-bold leading-tight">
                    {parts.day}
                  </span>

                  <span className="text-[11px] font-medium uppercase">
                    {parts.month}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SHOWTIMES */}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* City filter */}
        {places.length > 2 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">City:</span>

            {places.map((item) => (
              <button
                key={item}
                onClick={() => setPlace(item)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${activePlace === item
                    ? "border-[#f84464] bg-[#f84464] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#f84464] hover:text-[#f84464]"
                  }`}
              >
                {item === "All" ? "All cities" : item}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4abd5d]" />
            Available
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffa000]" />
            Filling fast
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f84464]" />
            Almost full
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🎬</div>

            <h3 className="mt-4 text-xl font-bold text-[#1f2533]">
              No shows available
            </h3>

            <p className="mt-2 text-slate-500">
              {activePlace !== "All"
                ? `There are no shows in ${activePlace}. Try another city.`
                : "Please check back later."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
            {groups.map((group) => (
              <div
                key={group.key}
                className="flex flex-col gap-4 p-5 md:flex-row md:gap-10"
              >
                <div className="md:w-72 md:shrink-0">
                  <h3 className="font-bold text-[#1f2533]">{group.name}</h3>

                  {group.location && (
                    <p className="mt-1 text-sm text-slate-500">
                      📍 {group.location}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {group.showtimes.map((showtime) => {
                    const start =
                      formatClock(getStart(showtime)) || "Time unavailable";

                    const left = showtime.availableSeats;

                    const soldOut = typeof left === "number" && left <= 0;

                    return (
                      <button
                        key={showtime._id}
                        disabled={soldOut}
                        onClick={() => navigate(`/seats/${showtime._id}`)}
                        title={
                          soldOut
                            ? "Sold out"
                            : typeof left === "number"
                              ? `${left} seats left`
                              : undefined
                        }
                        className={`group rounded-lg border px-4 py-2 text-center transition ${slotTone(
                          showtime
                        )}`}
                      >
                        <span className="block text-sm font-semibold">
                          {start}
                        </span>

                        <span className="block text-[10px] text-slate-400 group-hover:text-white/90">
                          {soldOut
                            ? "Sold out"
                            : `₹${showtime.price || 0} · ${formatScreen(showtime.screen) || "Screen 1"}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MovieDetails;

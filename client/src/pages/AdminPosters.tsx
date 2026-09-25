import { useEffect, useState } from "react";
import api from "../api/api";
import type { Movie } from "../types";
import Loading from "../components/Loading";
import PosterImage from "../components/PosterImage";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AdminPosters = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // The URL currently typed for each movie, keyed by movie id
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<Record<string, SaveStatus>>({});

  const [statusMessage, setStatusMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get("/movies");

        const data =
          response.data.movies || response.data.data || response.data;

        const list: Movie[] = Array.isArray(data) ? data : [];

        setMovies(list);

        // Pre-fill each box with the movie's current poster value
        const initialDrafts: Record<string, string> = {};

        list.forEach((movie) => {
          initialDrafts[movie._id] = movie.poster || "";
        });

        setDrafts(initialDrafts);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load movies");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleSave = async (movieId: string) => {
    const poster = (drafts[movieId] || "").trim();

    if (!poster) return;

    setStatus((current) => ({ ...current, [movieId]: "saving" }));

    try {
      await api.patch(`/movies/${movieId}/poster`, { poster });

      setMovies((current) =>
        current.map((movie) =>
          movie._id === movieId ? { ...movie, poster } : movie
        )
      );

      setStatus((current) => ({ ...current, [movieId]: "saved" }));
    } catch (err: any) {
      setStatus((current) => ({ ...current, [movieId]: "error" }));

      setStatusMessage((current) => ({
        ...current,
        [movieId]: err.response?.data?.message || "Could not save",
      }));
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1f2533]">Manage Movie Posters</h1>

      <p className="mt-1 text-sm text-slate-500">
        Paste an image link for each movie (right-click a poster on Wikipedia
        or TMDB and choose "Copy image address").
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {movies.map((movie) => {
          const draft = drafts[movie._id] ?? "";

          const movieStatus = status[movie._id] ?? "idle";

          return (
            <div
              key={movie._id}
              className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
            >
              <PosterImage
                movie={{ ...movie, poster: draft }}
                className="h-32 w-24 shrink-0 rounded-lg object-cover"
              />

              <div className="flex-1">
                <p className="font-semibold text-[#1f2533]">{movie.title}</p>

                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDrafts((current) => ({
                      ...current,
                      [movie._id]: e.target.value,
                    }));

                    setStatus((current) => ({
                      ...current,
                      [movie._id]: "idle",
                    }));
                  }}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-[#f84464]"
                />

                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleSave(movie._id)}
                    disabled={movieStatus === "saving" || !draft.trim()}
                    className="rounded-lg bg-[#f84464] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#e63a58] disabled:bg-slate-300"
                  >
                    {movieStatus === "saving" ? "Saving..." : "Save"}
                  </button>

                  {movieStatus === "saved" && (
                    <span className="text-sm text-green-600">✓ Saved</span>
                  )}

                  {movieStatus === "error" && (
                    <span className="text-sm text-red-600">
                      {statusMessage[movie._id] || "Could not save"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPosters;

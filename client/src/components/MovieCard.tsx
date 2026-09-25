import { Link } from "react-router-dom";

import type { Movie } from "../types";

import PosterImage from "./PosterImage";

interface Props {
  movie: Movie;
}

const MovieCard = ({ movie }: Props) => {
  const genre = Array.isArray(movie.genre)
    ? movie.genre.join(" / ")
    : movie.genre;

  return (
    <Link to={`/movies/${movie._id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-slate-200 shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <PosterImage
          movie={movie}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Rating bar, like BookMyShow */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-black/90 to-black/50 px-3 py-2 text-sm font-semibold text-white">
          {movie.rating ? (
            <>
              <span className="text-[#f84464]">★</span>

              <span>{movie.rating}/10</span>
            </>
          ) : (
            <span className="text-slate-300">New release</span>
          )}
        </div>
      </div>

      <h3 className="mt-3 truncate text-base font-semibold text-[#1f2533] group-hover:text-[#f84464]">
        {movie.title}
      </h3>

      <p className="truncate text-sm text-slate-500">
        {genre || "Movie"}
        {movie.language && ` • ${movie.language}`}
      </p>
    </Link>
  );
};

export default MovieCard;

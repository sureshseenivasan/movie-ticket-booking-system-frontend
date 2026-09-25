import { useState } from "react";

import { getPosterCandidates } from "../utils/poster";

import { posterGradient } from "../utils/posterColor";

interface Props {
  movie: any;
  className?: string;
}

// Shows the movie poster, trying each possible address in turn.
// If there is no poster (or none of them loads), a coloured card with
// the movie title is shown instead.
const PosterImage = ({ movie, className = "" }: Props) => {
  const candidates = getPosterCandidates(movie);

  const [failed, setFailed] = useState<string[]>([]);

  const title: string = movie?.title || "Movie";

  const url = candidates.find((candidate) => !failed.includes(candidate));

  if (url) {
    return (
      <img
        src={url}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={className}
        onError={() => {
          // Shown in the browser console (F12) to help find the broken link
          console.warn(`Poster failed to load for "${title}":`, url);

          setFailed((list) => [...list, url]);
        }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={title}
      className={`flex items-center justify-center p-4 text-center ${className}`}
      style={{ background: posterGradient(title) }}
    >
      <span className="text-xl font-extrabold leading-tight text-white drop-shadow">
        {title}
      </span>
    </div>
  );
};

export default PosterImage;

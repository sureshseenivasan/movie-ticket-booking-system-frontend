import type { SyntheticEvent } from "react";

import api from "../api/api";

// Built-in placeholder, so it works even when no external site is reachable
export const POSTER_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="400" height="600" fill="#1e293b"/>
      <text x="200" y="300" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#94a3b8" text-anchor="middle">No Poster</text>
    </svg>`
  );

// Where the backend is running (e.g. http://localhost:5000)
const backendOrigin = (): string => {
  try {
    return new URL(api.defaults.baseURL ?? "", window.location.origin).origin;
  } catch {
    return "";
  }
};

// Every address the poster might be found at, in the order they should be tried.
// An empty list means the movie has no usable poster.
export const getPosterCandidates = (movie: any): string[] => {
  const raw = [movie?.poster, movie?.posterUrl, movie?.image, movie?.backdrop].find(
    (value) => typeof value === "string" && value.trim() !== ""
  ) as string | undefined;

  if (!raw) return [];

  const url = raw.trim();

  // The old default in the Movie model points to a site that does not exist
  if (/^(https?:)?\/\/(www\.)?placeholder\.co\//i.test(url)) {
    return [];
  }

  if (/^data:/i.test(url) || /^https?:\/\//i.test(url)) return [url];

  if (url.startsWith("//")) return [`https:${url}`];

  // TMDB style path, e.g. "/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg"
  if (/^\/[A-Za-z0-9_-]{20,}\.(jpg|jpeg|png|webp)$/i.test(url)) {
    return [`https://image.tmdb.org/t/p/w500${url}`];
  }

  // Any other relative path, e.g. "/posters/kaithi.jpg":
  // first the frontend's public folder, then the backend.
  const path = url.startsWith("/") ? url : `/${url}`;

  return [path, `${backendOrigin()}${path}`];
};

// First address to try, or the built-in placeholder
export const getPosterUrl = (movie: any): string =>
  getPosterCandidates(movie)[0] ?? POSTER_FALLBACK;

// Use as <img onError={handlePosterError} />
export const handlePosterError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;

  if (img.dataset.fallback) return;

  img.dataset.fallback = "1";

  img.src = POSTER_FALLBACK;
};

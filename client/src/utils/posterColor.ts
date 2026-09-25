// Gives every movie its own colour, used when a poster image is missing.
const hueFromTitle = (title: string): number => {
  let hash = 0;

  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % 360;
  }

  return hash;
};

export const posterGradient = (title: string): string => {
  const hue = hueFromTitle(title || "Movie");

  return `linear-gradient(160deg, hsl(${hue} 55% 38%), hsl(${(hue + 50) % 360} 60% 14%))`;
};

import { useState } from "react";

const KEY = "moviebook:place";

// Remembers the chosen location ("All" or a theater location) between pages
export const useSelectedPlace = () => {
  const [place, setPlaceState] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) || "All";
    } catch {
      return "All";
    }
  });

  const setPlace = (value: string) => {
    setPlaceState(value);

    try {
      localStorage.setItem(KEY, value);
    } catch {
      // storage not available, ignore
    }
  };

  return [place, setPlace] as const;
};

export default useSelectedPlace;

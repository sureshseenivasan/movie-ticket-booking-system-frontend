import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import type { Showtime } from "../types";
import SeatLayout from "../components/SeatLayout";
import Loading from "../components/Loading";
import {
  formatScreen,
  formatShowSlot,
  formatTheaterLocation,
} from "../utils/showtime";

const MAX_SEATS = 10;

const SeatSelection = () => {
  const { showtimeId } = useParams();

  const navigate = useNavigate();

  const [showtime, setShowtime] = useState<Showtime | null>(null);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/showtimes/${showtimeId}`);

        const data =
          response.data.showtime || response.data.data || response.data;

        setShowtime(data);
      } catch (error: any) {
        console.error("Showtime Error:", error);

        setError(error.response?.data?.message || "Unable to load showtime");
      } finally {
        setLoading(false);
      }
    };

    if (showtimeId) {
      fetchShowtime();
    }
  }, [showtimeId]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <div className="rounded-2xl bg-red-50 p-8">
          <h2 className="text-2xl font-bold text-red-600">
            Something went wrong
          </h2>

          <p className="mt-3">{error}</p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-lg bg-[#f84464] px-6 py-3 font-semibold text-white"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  if (!showtime) {
    return <div className="p-10 text-center">Showtime not found.</div>;
  }

  const movie = typeof showtime.movie === "object" ? showtime.movie : null;

  const theater =
    typeof showtime.theater === "object" ? showtime.theater : null;

  const location = formatTheaterLocation(theater);

  const slot = formatShowSlot(showtime);

  const screenLabel = formatScreen(showtime.screen);

  // The Showtime model stores booked seats in "bookingSeats"
  const reservedSeats: string[] =
    (showtime as any).bookingSeats ||
    (showtime as any).bookedSeats ||
    (showtime as any).reservedSeats ||
    [];

  const price = showtime.price || 0;

  const total = selectedSeats.length * price;

  const handleSelect = (seats: string[]) => {
    if (seats.length > MAX_SEATS) {
      setNotice(`You can select up to ${MAX_SEATS} seats at a time`);

      return;
    }

    setNotice("");

    setSelectedSeats(seats);
  };

  const proceedBooking = () => {
    if (selectedSeats.length === 0) {
      setNotice("Please select at least one seat");

      return;
    }

    navigate(`/checkout/${showtimeId}`, {
      state: {
        selectedSeats,

        total,

        showtime,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] pb-28">
      {/* TOP BAR */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-full px-3 py-1 text-xl text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[#1f2533]">
              {movie?.title || "Movie"}
            </h1>

            <p className="truncate text-sm text-slate-500">
              {[theater?.name || "Theater", location]
                .filter(Boolean)
                .join(", ")}
              {slot && ` | ${slot}`}
            </p>
          </div>
        </div>
      </div>

      {/* SEATS */}

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {screenLabel && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                {screenLabel}
              </span>
            )}

            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              {reservedSeats.length} sold
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Max {MAX_SEATS} seats
            </span>
          </div>

          <SeatLayout
            selectedSeats={selectedSeats}
            setSelectedSeats={handleSelect}
            reservedSeats={reservedSeats}
            price={price}
          />

          {notice && (
            <p className="mt-5 text-center text-sm font-medium text-[#f84464]">
              {notice}
            </p>
          )}
        </div>
      </main>

      {/* BOTTOM PAY BAR */}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0 text-sm">
            {selectedSeats.length > 0 ? (
              <>
                <p className="font-semibold text-[#1f2533]">
                  {selectedSeats.length}{" "}
                  {selectedSeats.length === 1 ? "seat" : "seats"} · ₹{total}
                </p>

                <p className="truncate text-slate-500">
                  {selectedSeats.join(", ")}
                </p>
              </>
            ) : (
              <p className="text-slate-500">Select your seats to continue</p>
            )}
          </div>

          <button
            onClick={proceedBooking}
            disabled={selectedSeats.length === 0}
            className="shrink-0 rounded-lg bg-[#f84464] px-8 py-3 font-semibold text-white transition hover:bg-[#e63a58] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {selectedSeats.length > 0 ? `Pay ₹${total}` : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import type { Booking } from "../types";
import Loading from "../components/Loading";
import PosterImage from "../components/PosterImage";
import { downloadTicket } from "../utils/downloadTicket";
import {
  formatScreen,
  formatShowSlot,
  formatTheaterLocation,
} from "../utils/showtime";

const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        // Backend: GET /api/bookings/my-bookings  ->  { count, bookings }
        const response = await api.get("/bookings/my-bookings");

        const data =
          response.data.bookings || response.data.data || response.data;

        setBookings(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("My bookings error:", err.response?.data || err);

        setError(
          err.response?.data?.message ||
          "Could not load your bookings. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("Cancel this booking? The seats will be released.")) {
      return;
    }

    try {
      setCancellingId(bookingId);

      await api.put(`/bookings/${bookingId}/cancel`);

      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId
            ? { ...booking, bookingStatus: "CANCELLED" }
            : booking
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not cancel the booking");
    } finally {
      setCancellingId("");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-2xl font-bold text-[#1f2533]">My Bookings</h1>

          <p className="text-sm text-slate-500">
            Your tickets and past orders
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {error ? (
          <div className="rounded-xl bg-red-50 p-6 text-red-600">
            <p className="font-semibold">Something went wrong</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🎟️</div>

            <p className="mt-4 text-lg font-semibold text-[#1f2533]">
              You have no bookings yet
            </p>

            <button
              onClick={() => navigate("/")}
              className="mt-6 rounded-lg bg-[#f84464] px-8 py-3 font-semibold text-white hover:bg-[#e63a58]"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const showtime =
                typeof booking.showtime === "object" ? booking.showtime : null;

              const movie =
                showtime && typeof showtime.movie === "object"
                  ? showtime.movie
                  : null;

              const theater =
                showtime && typeof showtime.theater === "object"
                  ? showtime.theater
                  : null;

              const location = formatTheaterLocation(theater);

              const slot = formatShowSlot(showtime);

              const screenLabel = formatScreen(showtime?.screen);

              const cancelled = booking.bookingStatus === "CANCELLED";

              const bookingNumber = booking.bookingNumber ?? booking._id;

              return (
                <div
                  key={booking._id}
                  className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm sm:flex-row"
                >
                  <PosterImage
                    movie={movie}
                    className="h-48 w-full shrink-0 object-cover sm:h-auto sm:w-36"
                  />

                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-xl font-extrabold text-[#1f2533]">
                        {movie?.title || "Movie"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${cancelled
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-700"
                          }`}
                      >
                        {cancelled ? "CANCELLED" : "CONFIRMED"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {theater?.name || "Theater"}
                      {location && `, ${location}`}
                    </p>

                    {slot && (
                      <p className="mt-1 text-sm font-semibold text-[#1f2533]">
                        🕒 {slot}
                        {screenLabel && ` · ${screenLabel}`}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.seats.map((seat) => (
                        <span
                          key={seat}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-[#1f2533]"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 break-all text-xs text-slate-500">
                      Booking ID: <span className="font-mono">{bookingNumber}</span>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xl font-extrabold text-[#1ea83c]">
                        ₹{booking.totalAmount ?? 0}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            downloadTicket({
                              bookingNumber,
                              movieTitle: movie?.title || "Movie",
                              theaterName: location
                                ? `${theater?.name || "Theater"}, ${location}`
                                : theater?.name || "Theater",
                              screen: screenLabel || undefined,
                              showTime: slot || undefined,
                              seats: booking.seats,
                              totalAmount: booking.totalAmount ?? 0,
                            })
                          }
                          className="rounded-lg bg-[#f84464] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e63a58]"
                        >
                          Download Ticket
                        </button>

                        {!cancelled && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {cancellingId === booking._id
                              ? "Cancelling..."
                              : "Cancel Booking"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

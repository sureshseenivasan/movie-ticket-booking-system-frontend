import { useEffect, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import api from "../api/api";

import { useAuth } from "../context/AuthContext";

import { downloadTicket, type TicketDetails } from "../utils/downloadTicket";

import {
  formatScreen,
  formatShowSlot,
  formatTheaterLocation,
} from "../utils/showtime";

import PosterImage from "../components/PosterImage";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CheckoutState = {
  selectedSeats?: string[];
  total?: number;
  showtime?: any;
} | null;

type DeliveryStatus = {
  state: "idle" | "sending" | "sent" | "failed";
  message?: string;
};

const paymentLabels: Record<string, string> = {
  online: "Online (Razorpay)",
  cash: "Cash",
};

const paymentMethods = [
  {
    value: "online",
    icon: "💳",
    label: "Pay Online",
    hint: "UPI, cards, netbanking & wallets via Razorpay",
  },
  {
    value: "cash",
    icon: "💵",
    label: "Pay at theater",
    hint: "Pay in cash at the counter before the show",
  },
];

const Checkout = () => {
  const { showtimeId } = useParams();

  const location = useLocation();

  const navigate = useNavigate();

  const { user } = useAuth();

  const state = location.state as CheckoutState;

  const selectedSeats = state?.selectedSeats ?? [];

  const total = state?.total ?? 0;

  const [paymentMethod, setPaymentMethod] = useState("online");

  const [formError, setFormError] = useState("");

  const [processing, setProcessing] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const userEmail: string = (user as any)?.email ?? "";

  const userPhone: string = (user as any)?.phone ?? "";

  const [notifyPhone, setNotifyPhone] = useState<string | null>(null);

  const phoneToSend = notifyPhone ?? userPhone;

  const [emailStatus, setEmailStatus] = useState<DeliveryStatus>({ state: "idle" });

  const [smsStatus, setSmsStatus] = useState<DeliveryStatus>({ state: "idle" });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const validatePhone = (): string => {
    const phoneDigits = phoneToSend.replace(/\D/g, "");

    if (phoneToSend.trim() && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      return "Enter a valid mobile number, or leave it empty";
    }

    return "";
  };

  const deliver = async (bookingId: string, channel: "email" | "sms") => {
    const setStatus = channel === "email" ? setEmailStatus : setSmsStatus;

    const value = channel === "email" ? userEmail.trim() : phoneToSend.trim();

    if (!value) return;

    setStatus({ state: "sending" });

    try {
      await api.post(
        `/bookings/${bookingId}/notify`,
        channel === "email" ? { email: value } : { phone: value }
      );

      setStatus({ state: "sent" });
    } catch (error: any) {
      setStatus({
        state: "failed",
        message: error.response?.data?.message || "Could not send",
      });
    }
  };

  const sendConfirmation = (bookingId: string) => {
    deliver(bookingId, "email");

    deliver(bookingId, "sms");
  };

  const loadBookingDetails = async (bookingId: string, fallback: any) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);

      setConfirmedBooking(response.data.booking ?? response.data);
    } catch (err) {
      console.error("Could not load full booking details:", err);

      setConfirmedBooking(fallback);
    }
  };

  // Loads the Razorpay checkout script once, the first time it's needed
  const loadRazorpayScript = (): Promise<boolean> => {
    if (window.Razorpay) return Promise.resolve(true);

    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // ---------- ONLINE PAYMENT (Razorpay) ----------

  // Runs one step of the payment flow and, if it fails, says WHICH step
  // failed and why, so the red message on screen points at the real cause.
  const runStep = async <T,>(label: string, action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (err: any) {
      const status = err.response?.status;

      const detail = err.response?.data?.message || err.message || "Unknown error";

      console.error(`${label} failed:`, err.response?.data || err);

      throw new Error(`${label} failed${status ? ` (status ${status})` : ""}: ${detail}`);
    }
  };

  const handleOnlinePayment = async () => {
    // 1. Lock the seats so no one else can take them while paying
    await runStep("Step 1 (locking seats)", () =>
      api.post("/seat-locks", { showtimeId, seatNumbers: selectedSeats })
    );

    // 2. Create the Razorpay order (this also creates the PENDING booking)
    const orderResponse = await runStep("Step 2 (creating payment order)", () =>
      api.post("/payments/create-order", {
        showtimeId,
        seatNumbers: selectedSeats,
      })
    );

    const { bookingId, order, key } = orderResponse.data;

    // 3. Load Razorpay's checkout script
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Step 3 (loading Razorpay) failed: the payment script could not be loaded. Turn off any ad blocker and check your internet connection."
      );
    }

    // 4. Open the Razorpay window, then verify the payment on the server
    await new Promise<void>((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "MovieBook",
        description: "Movie ticket booking",
        prefill: { email: userEmail },
        theme: { color: "#f84464" },
        handler: async (response: any) => {
          try {
            await api.post("/payments/verify", {
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            resolve();
          } catch (verifyError: any) {
            reject(
              new Error(
                `Step 4 (verifying payment) failed: ${verifyError.response?.data?.message || verifyError.message
                }`
              )
            );
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment was cancelled")),
        },
      });

      razorpay.open();
    });

    await loadBookingDetails(bookingId, { _id: bookingId, seats: selectedSeats, totalAmount: total });

    sendConfirmation(bookingId);
  };

  // ---------- PAY AT THEATER (cash, no real payment) ----------

  const handleCashBooking = async () => {
    const bookingResponse = await api.post("/bookings", {
      showtimeId,
      seatNumbers: selectedSeats,
    });

    const booking = bookingResponse.data.booking ?? bookingResponse.data;

    await loadBookingDetails(booking._id, booking);

    sendConfirmation(booking._id);
  };

  const handlePayment = async () => {
    if (!showtimeId) {
      alert("Showtime not found. Please select your seats again.");
      navigate("/");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("At least one seat must be selected");
      navigate("/");
      return;
    }

    const phoneError = validatePhone();

    if (phoneError) {
      setFormError(phoneError);
      return;
    }

    setFormError("");

    try {
      setProcessing(true);

      if (paymentMethod === "online") {
        await handleOnlinePayment();
      } else {
        await handleCashBooking();
      }
    } catch (error: any) {
      console.error("Checkout error:", error.response?.data || error);

      setFormError(
        error.response?.data?.message || error.message || "Booking failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------------------------
  // BOOKING CONFIRMATION SCREEN
  // ---------------------------------------------

  if (confirmedBooking) {
    const showtimeInfo =
      typeof confirmedBooking.showtime === "object" && confirmedBooking.showtime?.movie
        ? confirmedBooking.showtime
        : state?.showtime;

    const movieTitle =
      typeof showtimeInfo?.movie === "object" ? showtimeInfo.movie.title : "Movie";

    const theaterName =
      typeof showtimeInfo?.theater === "object" ? showtimeInfo.theater.name : "Theater";

    const showTime = formatShowSlot(showtimeInfo);

    const theaterLocation = formatTheaterLocation(showtimeInfo?.theater);

    const screenLabel = formatScreen(showtimeInfo?.screen);

    const seats: string[] = confirmedBooking.seats ?? selectedSeats;

    const amountPaid = confirmedBooking.totalAmount ?? total;

    const bookingNumber: string = confirmedBooking.bookingNumber ?? confirmedBooking._id;

    const ticket: TicketDetails = {
      bookingNumber,
      movieTitle,
      theaterName: theaterLocation ? `${theaterName}, ${theaterLocation}` : theaterName,
      screen: screenLabel || undefined,
      showTime: showTime || undefined,
      seats,
      paymentMethod: paymentLabels[paymentMethod] ?? paymentMethod,
      totalAmount: amountPaid,
    };

    return (
      <div className="min-h-screen bg-[#f2f2f2] px-4 py-10">
        <div className="mx-auto max-w-md">
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="bg-[#1ea83c] px-6 py-6 text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                ✓
              </div>

              <h1 className="mt-3 text-2xl font-bold">Booking Confirmed!</h1>

              <p className="mt-1 break-all text-sm text-white/90">
                Booking ID: {bookingNumber}
              </p>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-extrabold text-[#1f2533]">{movieTitle}</h2>

              <p className="mt-1 text-sm text-slate-500">
                {theaterName}
                {theaterLocation && `, ${theaterLocation}`}
              </p>

              {showTime && (
                <p className="mt-2 text-sm font-semibold text-[#1f2533]">
                  🕒 {showTime}
                </p>
              )}

              {screenLabel && <p className="mt-1 text-sm text-slate-500">{screenLabel}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {seats.map((seat) => (
                  <span
                    key={seat}
                    className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-[#1f2533]"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative border-t-2 border-dashed border-slate-200">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#f2f2f2]" />

              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#f2f2f2]" />
            </div>

            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-xs text-slate-500">Amount paid</p>

                <p className="text-2xl font-extrabold text-[#1ea83c]">₹{amountPaid}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Payment</p>

                <p className="font-semibold text-[#1f2533]">
                  {paymentLabels[paymentMethod] ?? paymentMethod}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => downloadTicket(ticket)}
            className="mt-5 w-full rounded-lg bg-[#f84464] py-3 font-semibold text-white transition hover:bg-[#e63a58]"
          >
            Download Ticket (PDF)
          </button>

          <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-bold text-[#1f2533]">Booking details sent to you</h2>

            {(
              [
                { key: "email", label: "Email", target: userEmail.trim(), status: emailStatus },
                { key: "sms", label: "SMS", target: phoneToSend.trim(), status: smsStatus },
              ] as const
            ).map(({ key, label, target, status }) => (
              <div key={key} className="mt-3 text-sm">
                {!target ? (
                  <p className="text-slate-500">
                    {label}: not sent (
                    {key === "email" ? "no email address" : "no mobile number"} given)
                  </p>
                ) : status.state === "failed" ? (
                  <div className="rounded-lg bg-red-50 p-3 text-red-600">
                    <p>
                      ✗ Could not send {label}
                      {status.message ? `: ${status.message}` : ""}
                    </p>

                    <button
                      onClick={() => deliver(confirmedBooking._id, key)}
                      className="mt-2 font-semibold underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : status.state === "sent" ? (
                  <p className="text-green-700">
                    ✓ {label} sent to {target}
                  </p>
                ) : (
                  <p className="text-slate-500">Sending {label} to {target}...</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/bookings")}
              className="w-full rounded-lg border border-[#f84464] py-3 font-semibold text-[#f84464] hover:bg-[#f84464]/5"
            >
              View My Bookings
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // CHECKOUT FORM
  // ---------------------------------------------

  const info = state?.showtime;

  const infoMovie = typeof info?.movie === "object" ? info.movie : null;

  const infoTheater = typeof info?.theater === "object" ? info.theater : null;

  const infoSlot = formatShowSlot(info);

  const infoLocation = formatTheaterLocation(infoTheater);

  const infoScreen = formatScreen(info?.screen);

  const pricePerSeat =
    info?.price ?? (selectedSeats.length ? total / selectedSeats.length : 0);

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-[#f84464] focus:ring-2 focus:ring-[#f84464]/20";

  return (
    <div className="min-h-screen bg-[#f2f2f2] pb-10">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-full px-3 py-1 text-xl text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>

          <h1 className="text-lg font-bold text-[#1f2533]">
            Review your booking and pay
          </h1>
        </div>
      </div>

      <main className="mx-auto mt-6 grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1f2533]">Payment options</h2>

          <div className="mt-4 space-y-3">
            {paymentMethods.map((method) => {
              const active = paymentMethod === method.value;

              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method.value);
                    setFormError("");
                  }}
                  className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${active ? "border-[#f84464] bg-[#f84464]/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <span className="text-2xl">{method.icon}</span>

                  <span className="flex-1">
                    <span className="block font-semibold text-[#1f2533]">{method.label}</span>

                    <span className="block text-sm text-slate-500">{method.hint}</span>
                  </span>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-[#f84464]" : "border-slate-300"
                      }`}
                  >
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-[#f84464]" />}
                  </span>
                </button>
              );
            })}
          </div>

          {paymentMethod === "online" && (
            <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              You'll be redirected to Razorpay's secure checkout to complete payment by
              UPI, card, netbanking or wallet. Card and UPI details are never seen by
              this app.
            </p>
          )}

          {paymentMethod === "cash" && (
            <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Pay in cash at the theater counter before the show.
            </p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <label className="font-semibold text-[#1f2533]">
              Mobile number for SMS (optional)
            </label>

            <input
              type="tel"
              value={phoneToSend}
              onChange={(e) => setNotifyPhone(e.target.value)}
              placeholder="9876543210"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-500">
              Your booking details are emailed to {userEmail || "your email"}{" "}
              automatically after payment.
            </p>
          </div>
        </section>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-[#1f2533]">Order summary</h2>

          <div className="mt-4 flex gap-4">
            {infoMovie && (
              <PosterImage
                movie={infoMovie}
                className="h-24 w-16 shrink-0 rounded-lg object-cover"
              />
            )}

            <div className="min-w-0">
              <p className="font-bold text-[#1f2533]">{infoMovie?.title || "Movie"}</p>

              <p className="mt-1 text-sm text-slate-500">
                {infoTheater?.name || "Theater"}
                {infoLocation && `, ${infoLocation}`}
              </p>

              {infoSlot && <p className="mt-1 text-sm text-slate-500">{infoSlot}</p>}

              {infoScreen && <p className="text-sm text-slate-500">{infoScreen}</p>}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Seats</span>

              <span className="font-semibold">{selectedSeats.join(", ")}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-slate-500">
                Tickets ({selectedSeats.length} × ₹{pricePerSeat})
              </span>

              <span className="font-semibold">₹{total}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-extrabold text-[#1f2533]">
            <span>Amount payable</span>

            <span>₹{total}</span>
          </div>

          {formError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {formError}
            </p>
          )}

          <button
            onClick={handlePayment}
            disabled={processing}
            className="mt-5 w-full rounded-lg bg-[#f84464] py-3 font-semibold text-white transition hover:bg-[#e63a58] disabled:bg-slate-300"
          >
            {processing ? "Processing..." : `Pay ₹${total}`}
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            {paymentMethod === "online"
              ? "Secure payment powered by Razorpay."
              : "No payment is collected now — pay at the theater."}
          </p>
        </aside>
      </main>
    </div>
  );
};

export default Checkout;

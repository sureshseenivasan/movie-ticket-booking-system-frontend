interface Props {
  selectedSeats: string[];

  setSelectedSeats: (seats: string[]) => void;

  reservedSeats?: string[];

  price?: number;
}

// 12 rows (A-L) x 12 seats = 144 seats per screen
const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const SEATS_PER_ROW = 12;

// Walkway (gap) after this many seats in every row
const AISLE_AFTER = 6;

const SeatLayout = ({
  selectedSeats,
  setSelectedSeats,
  reservedSeats = [],
  price,
}: Props) => {
  const toggleSeat = (seatNumber: string) => {
    // Sold seats cannot be selected
    if (reservedSeats.includes(seatNumber)) {
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((seat) => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Back row at the top, row A closest to the screen
  const displayRows = [...ROWS].reverse();

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* PRICE HEADING */}

      <p className="border-b border-slate-200 pb-2 text-base font-semibold text-slate-600">
        {price !== undefined && `₹${price} `}
        <span className="text-slate-400">SEATS</span>
      </p>

      {/* SEATS */}

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="mx-auto w-fit space-y-2">
          {displayRows.map((row) => (
            <div key={row} className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-6 text-center text-sm font-semibold text-slate-400">
                {row}
              </span>

              {Array.from({ length: SEATS_PER_ROW }).map((_, index) => {
                const seat = `${row}${index + 1}`;

                const isSelected = selectedSeats.includes(seat);

                const isReserved = reservedSeats.includes(seat);

                return (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => toggleSeat(seat)}
                    disabled={isReserved}
                    title={isReserved ? `${seat} (sold)` : seat}
                    aria-label={isReserved ? `Seat ${seat} sold` : `Seat ${seat}`}
                    className={`h-7 w-7 rounded-md border text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm ${index + 1 === AISLE_AFTER ? "mr-3 sm:mr-6" : ""
                      } ${isReserved
                        ? "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                        : isSelected
                          ? "border-[#1ea83c] bg-[#1ea83c] text-white shadow"
                          : "border-[#1ea83c] bg-white text-[#1ea83c] hover:bg-[#1ea83c]/10"
                      }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* SCREEN */}

      <div className="mt-8">
        <div className="mx-auto h-4 w-3/4 rounded-t-[50%] border-t-4 border-slate-300 bg-linear-to-b from-slate-100 to-transparent" />

        <p className="mt-2 text-center text-xs text-slate-500">
          All eyes this way please!
        </p>
      </div>

      {/* LEGEND */}

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-[#1ea83c] bg-white" />
          Available
        </div>

        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-[#1ea83c] bg-[#1ea83c]" />
          Selected
        </div>

        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-slate-200 bg-slate-200" />
          Sold
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;

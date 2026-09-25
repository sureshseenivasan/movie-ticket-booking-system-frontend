import { jsPDF } from "jspdf";

export type TicketDetails = {
  bookingNumber: string;
  movieTitle: string;
  theaterName: string;
  screen?: string;
  showTime?: string;
  seats: string[];
  paymentMethod?: string;
  totalAmount: number;
};

// Generates a PDF ticket and downloads it in the browser.
// Note: the default PDF fonts do not include the ₹ symbol, so "Rs." is used.
export const downloadTicket = (ticket: TicketDetails) => {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ---------- HEADER ----------

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MovieBook", 10, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("E-Ticket / Booking Confirmation", 10, 23);

  // ---------- DETAILS ----------

  const rows: { label: string; value: string }[] = [
    { label: "Booking ID", value: ticket.bookingNumber },
    { label: "Movie", value: ticket.movieTitle },
    { label: "Theater", value: ticket.theaterName },
    ...(ticket.screen ? [{ label: "Screen", value: ticket.screen }] : []),
    ...(ticket.showTime ? [{ label: "Show time", value: ticket.showTime }] : []),
    { label: "Seats", value: ticket.seats.join(", ") },
    ...(ticket.paymentMethod
      ? [{ label: "Payment method", value: ticket.paymentMethod }]
      : []),
  ];

  let y = 44;

  rows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(row.label.toUpperCase(), 10, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);

    const lines: string[] = doc.splitTextToSize(row.value, pageWidth - 20);

    doc.text(lines, 10, y + 6);

    y += 6 + lines.length * 6 + 5;
  });

  // ---------- TOTAL ----------

  doc.setDrawColor(203, 213, 225);
  doc.line(10, y - 2, pageWidth - 10, y - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text(`Total paid: Rs. ${ticket.totalAmount}`, 10, y + 8);

  // ---------- FOOTER ----------

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Show this ticket at the theater entrance. Enjoy the movie!",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  doc.save(`ticket-${ticket.bookingNumber}.pdf`);
};

export default downloadTicket ;

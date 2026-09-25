export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Movie {
  _id: string;

  title: string;

  description?: string;

  genre: string | string[];

  language?: string;

  duration?: number;

  releaseDate?: string;

  poster?: string;

  posterUrl?: string;

  image?: string;

  backdrop?: string;

  rating?: number;
}

export interface Theater {
  _id: string;

  name: string;

  location?: string;

  address?: string;

  screens?: { name: string; totalSeats: number }[];
}

export interface Showtime {
  _id: string;

  movie: Movie | string;

  theater: Theater | string;

  screen?: string;

  date?: string;

  showDate?: string;

  // "18:30" style strings, as stored by the Showtime model
  startTime?: string;

  endTime?: string;

  time?: string;

  showTime?: string;

  price?: number;

  totalSeats?: number;

  availableSeats?: number;

  // Seats that are already booked (Showtime model field)
  bookingSeats?: string[];

  bookingNumber?: string[];

  bookingStatus?: string[];
  paymentStatus?: string[];

  bookedSeats?: string[];

  reservedSeats?: string[];
}

export interface Booking {
  bookingNumber: string;
  bookingStatus: string;
  _id: string;

  user?: User | string;

  movie?: Movie | string;

  theater?: Theater | string;

  showtime: Showtime | string;

  seats: string[];

  totalAmount?: number;

  status?: string;

  createdAt?: string;
}

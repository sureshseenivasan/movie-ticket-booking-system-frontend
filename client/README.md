🎬 MovieBook — Movie Ticket Booking System

A full-stack movie ticket booking web app. Browse movies, pick a showtime and seats, pay (mock payment), and get your booking confirmed by email and SMS.

Tech Stack

Frontend

React + Vite (TypeScript)
Tailwind CSS
React Router
Axios
jsPDF (ticket download)

Backend

Node.js + Express (TypeScript)
MongoDB + Mongoose
JWT authentication

Third-party services

TMDB — real movie posters
Resend — booking confirmation emails
Twilio — booking confirmation SMS (optional)
Features
Browse, search, and filter movies by title, genre, language, and city
Auto-rotating featured movies banner
Showtimes grouped by date, theater, and time, with live seat-availability coloring
Interactive 12×12 seat map (144 seats/screen) with an aisle gap
Mock checkout: UPI / card / cash, with input validation
Booking confirmation screen with a printable ticket layout
Downloadable PDF ticket
Automatic email (and optional SMS) with booking details after payment
"My Bookings" page: view, download ticket, and cancel any booking
Admin page to update a movie's poster via URL (/admin/posters)
JWT-based login/register with a two-panel branded auth UI
Project Structure
movie-ticket-booking-system/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # Home, MovieDetails, SeatSelection, Checkout, MyBookings, Login, Register, AdminPosters
│       ├── components/      # Navbar, MovieCard, SeatLayout, PosterImage, AuthLayout, Loading
│       ├── utils/           # showtime.ts, poster.ts, posterColor.ts, downloadTicket.ts
│       ├── hooks/           # useSelectedPlace.ts
│       ├── context/         # AuthContext.tsx
│       └── types/           # index.ts
└── server/                  # Express backend
    ├── src/
    │   └── seed.ts          # wipes and rebuilds movies/theaters/showtimes/seats
    ├── config/db.ts         # MongoDB connection
    ├── models/               # Movie, Theater, Showtime, Seat, Booking, User
    ├── controllers/          # movieController, bookingController, authController, ...
    ├── routes/               # movieRoutes, bookingRoutes, authRoutes, ...
    ├── services/
    │   └── notificationService.ts   # email (Resend) + SMS (Twilio)
    ├── scripts/
    │   ├── fetchPosters.ts          # fills in real posters from TMDB
    │   └── addUpcomingShowtimes.ts  # adds showtimes for movies with none upcoming
    └── data/
        ├── movies.ts
        └── theaters.ts
Setup
1. Clone and install
bash
cd server && npm install
cd ../client && npm install
2. Environment variables

Create server/.env (never commit this file):

env
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/movieTicketDB?retryWrites=true&w=majority

JWT_SECRET=your_jwt_secret_here

# Email (Resend — resend.com)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=MovieBook <onboarding@resend.dev>

# SMS (Twilio — optional; console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Posters (TMDB — themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_v3_key

Create client/.env if your API base URL differs from the default:

env
VITE_API_URL=http://localhost:5000/api
3. Seed the database
bash
cd server
npx tsx src/seed.ts               # movies, theaters, showtimes (next 7 days), seats
npx tsx scripts/fetchPosters.ts   # fills in real posters via TMDB

seed.ts wipes and rebuilds movies, theaters, showtimes, and seats every time it runs — only run it when you're okay resetting that data. Bookings and users are not touched.

4. Run the app
bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev

Frontend: http://localhost:5173 Backend: http://localhost:5000

Useful Scripts
Command	What it does
npx tsx src/seed.ts	Rebuilds movies, theaters, showtimes, and seats from scratch
npx tsx scripts/fetchPosters.ts	Looks up and saves a real poster for every movie via TMDB
npx tsx scripts/addUpcomingShowtimes.ts	Adds showtimes for the next 7 days, only for movies with none upcoming (safe to re-run, doesn't touch existing data)
Adding Content
New movies: add entries to server/data/movies.ts, then re-run seed.ts and fetchPosters.ts.
New theaters/cities: add entries to server/data/theaters.ts with a location field — the city filters on the Home and Movie Details pages pick these up automatically.
Fix a wrong poster: go to /admin/posters in the app and paste a correct image URL for that movie.
Known Limitations
No admin role system. /admin/posters only requires being logged in, not a specific admin account. Fine for personal use; add an isAdmin field to the User model before showing this to others.
Resend sandbox limit. Until a custom domain is verified with Resend, email can only be sent to the address you signed up with on Resend.
Twilio trial limit. A trial Twilio account can only send SMS to phone numbers verified in the Twilio console.
Mock payment only. No real payment gateway is integrated — checkout simulates a delay and always "succeeds" once valid-looking details are entered.
License

Personal / educational project.

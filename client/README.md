# MovieBook — Frontend (client)

React + Vite + TypeScript frontend for the MovieBook ticket booking app.

## Live Deployment

- **Live Site:** `https://your-site-name.netlify.app`
- **Connected Backend API:** `https://your-backend-name.onrender.com/api`
- **Backend Repository:** `https://github.com/your-username/movie-ticket-booking-system-backend`

> **Note:** the backend is hosted on Render's free tier, so it sleeps after 15 minutes of inactivity. The first request after idle time may take 30-60 seconds to respond.

## Demo Credentials

```
Email:    demo@moviebook.com
Password: Demo@1234
```

> Register this account on the live site first if it doesn't already exist, or replace these with real demo credentials before sharing. Don't use your own personal login here.

## Tech Stack

- React + Vite (TypeScript)
- Tailwind CSS
- React Router
- Axios
- jsPDF (PDF ticket download)

## Requirements

- Node.js 18+
- The backend API running (see the backend repository above) — either locally or the live deployed one

## Local Setup

```bash
npm install
```

Create `.env` in this folder:
```env
VITE_API_URL=http://localhost:5000/api
```

To point your local frontend at the **live** deployed backend instead of running the backend locally:
```env
VITE_API_URL=https://your-backend-name.onrender.com/api
```

## Run

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Deployment (Netlify)

| Setting | Value |
|---|---|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `client/dist` (or `dist`, relative to base directory) |
| Environment variable | `VITE_API_URL=https://your-backend-name.onrender.com/api` |

`public/_redirects` must contain `/*    /index.html   200` for client-side routing (React Router) to work correctly on page refresh/direct links.

> **Important:** after changing `VITE_API_URL` in Netlify, you must trigger a fresh deploy (Deploys → Trigger deploy → Clear cache and deploy site) — Vite bakes environment variables in at build time, so saving the variable alone has no effect until the site is rebuilt.

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx           # movie grid, search, genre/language/city filters, hero banner
│   ├── MovieDetails.tsx   # showtimes by date/theater, city filter
│   ├── SeatSelection.tsx  # 12x12 seat map, sticky pay bar
│   ├── Checkout.tsx       # payment form + booking confirmation screen
│   ├── MyBookings.tsx     # booking history, download ticket, cancel
│   ├── Login.tsx / Register.tsx
│   └── AdminPosters.tsx   # paste a poster URL for any movie
├── components/
│   ├── Navbar.tsx
│   ├── MovieCard.tsx
│   ├── SeatLayout.tsx
│   ├── PosterImage.tsx    # poster with coloured-title fallback
│   ├── AuthLayout.tsx     # shared layout for Login/Register
│   └── Loading.tsx
├── utils/
│   ├── showtime.ts        # date/time formatting, screen labels, theater location
│   ├── poster.ts          # resolves the best poster URL, with fallback
│   ├── posterColor.ts     # deterministic colour per movie title
│   └── downloadTicket.ts  # generates the PDF ticket
├── hooks/
│   └── useSelectedPlace.ts # remembers the chosen city across pages
├── context/
│   └── AuthContext.tsx    # login/logout, token + user in localStorage
├── types/
│   └── index.ts
└── api/
    └── api.ts             # axios instance, attaches the auth token
```

## Notes

- The city filter reads each theater's `location` field from the backend — no frontend changes needed when new cities/theaters are added on the backend.
- A movie with no working poster shows a coloured card with its title instead of a broken image.
- `/admin/posters` requires being logged in but has no admin-role check yet — see the backend README's known limitations.

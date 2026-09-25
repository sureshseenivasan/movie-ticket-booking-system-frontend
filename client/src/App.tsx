import {BrowserRouter, Routes,Route,} from "react-router-dom";

import { AuthProvider,} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";

import Login from "./pages/Login";

import Register from "./pages/Register";

import MovieDetails from "./pages/MovieDetails";

import SeatSelection from "./pages/SeatSelection";

import Checkout from "./pages/Checkout";

import MyBookings from "./pages/Mybookings";
import AdminPosters from "./pages/AdminPosters";

function App() {

  return (

    <BrowserRouter>

      <AuthProvider>

        <div className="min-h-screen bg-slate-50">

          <Navbar />

          <Routes>

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/movies/:id"
              element={<MovieDetails />}
            />

            <Route
              path="/seats/:showtimeId"
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout/:showtimeId"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/posters" element={<AdminPosters />} />
          </Routes>


        </div>

      </AuthProvider>

    </BrowserRouter>

  );
}

export default App;

import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

interface Screen {
  name: string;
  totalSeats: number;
}

interface Theater {
  _id: string;
  name: string;
  location: string;
  address: string;
  screens: Screen[];
}

const emptyForm = {
  name: "",
  location: "",
  address: "",
  screenCount: 2,
  seatsPerScreen: 144,
  createShowtimes: true,
};

const inputClass =
  "w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-[#f84464]";

const AdminTheaters = () => {
  const { user } = useAuth();

  // null = still checking, true = admin, false = not an admin
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const [theaters, setTheaters] = useState<Theater[]>([]);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const fetchTheaters = async () => {
    try {
      const response = await api.get("/admin/theaters");

      setTheaters(response.data.theaters || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load theaters");
    }
  };

  useEffect(() => {
    if (!user) {
      setAllowed(false);

      return;
    }

    const checkAdmin = async () => {
      try {
        await api.get("/admin/check");

        setAllowed(true);

        fetchTheaters();
      } catch {
        setAllowed(false);
      }
    };

    checkAdmin();
  }, [user]);

  const handleCreate = async () => {
    setError("");

    setSuccess("");

    if (!form.name.trim() || !form.location.trim() || !form.address.trim()) {
      setError("Name, location and address are required");
      return;
    }

    const screens = Array.from({ length: form.screenCount }).map((_, i) => ({
      name: `Screen ${i + 1}`,
      totalSeats: form.seatsPerScreen,
    }));

    try {
      setSaving(true);

      const response = await api.post("/admin/theaters", {
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        screens,
        createShowtimes: form.createShowtimes,
      });

      const created = response.data.showtimesCreated ?? 0;

      setSuccess(
        created > 0
          ? `Theater added with ${created} showtimes for the next 7 days. It now appears on the site.`
          : "Theater added."
      );

      setForm(emptyForm);

      fetchTheaters();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not add theater");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this theater?")) return;

    setError("");

    setSuccess("");

    try {
      setDeletingId(id);

      await api.delete(`/admin/theaters/${id}`);

      setTheaters((current) => current.filter((t) => t._id !== id));

      setSuccess("Theater deleted.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not delete theater");
    } finally {
      setDeletingId("");
    }
  };

  if (allowed === null) {
    return <Loading />;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#1f2533]">Admin access required</h1>

        <p className="mt-2 text-slate-500">
          Log in with an admin account to manage theaters.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1f2533]">Manage Theaters</h1>

      <p className="mt-1 text-sm text-slate-500">
        Add a theater and its screens. Theaters that already have showtimes can't be
        deleted.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {success && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#1f2533]">Add a Theater</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Theater name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="City / location (e.g. Chennai)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={inputClass}
          />

          <input
            type="text"
            placeholder="Full address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />

          <label className="text-sm text-slate-600">
            Number of screens (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={form.screenCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  screenCount: Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                })
              }
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="text-sm text-slate-600">
            Seats per screen (1-144)
            <input
              type="number"
              min={1}
              max={144}
              value={form.seatsPerScreen}
              onChange={(e) =>
                setForm({
                  ...form,
                  seatsPerScreen: Math.min(144, Math.max(1, Number(e.target.value) || 1)),
                })
              }
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.createShowtimes}
            onChange={(e) => setForm({ ...form, createShowtimes: e.target.checked })}
          />
          Also create showtimes for the next 7 days, so the theater appears on the
          site
        </label>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="mt-4 rounded-lg bg-[#f84464] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e63a58] disabled:bg-slate-300"
        >
          {saving ? "Adding..." : "Add Theater"}
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {theaters.map((theater) => (
          <div
            key={theater._id}
            className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#1f2533]">{theater.name}</p>

              <p className="truncate text-sm text-slate-500">
                {theater.address}, {theater.location} · {theater.screens.length} screen
                {theater.screens.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={() => handleDelete(theater._id)}
              disabled={deletingId === theater._id}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingId === theater._id ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTheaters;

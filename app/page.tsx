"use client";
import { Cormorant_Garamond } from "next/font/google";
import { useEffect, useState } from "react";

const titleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function Home() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [startingVibe, setStartingVibe] = useState("chill");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/rocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name,
          startingVibe,
          timezone,
          latitude: 40.7128,
          longitude: -74.006,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setPhone("");
      setName("");
      setStartingVibe("chill");
      setSuccess("Your rock has been adopted. Check your phone.");
    } catch {
      setError("Failed to submit form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            adopt your pet rock
          </h1>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">phone</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="phone"
              type="tel"
              placeholder="+1 676 767 6767"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">rock name</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="name"
              type="text"
              placeholder="Pebble"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">
              starting vibe
            </span>
            <select
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="startingVibe"
              value={startingVibe}
              onChange={(e) => setStartingVibe(e.target.value)}
            >
              <option value="chill">chill</option>
              <option value="dramatic">dramatic</option>
              <option value="crashing out">crashing out</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">timezone</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="timezone"
              type="text"
              placeholder="America/New_York"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}

          <button
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            type="submit"
            disabled={loading}
          >
            {loading ? "adopting..." : "adopt my rock"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function Home() {
  return (

    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Pet Rock
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sign up for your rock
          </h1>
        </div>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">Phone</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="phone"
              type="tel"
              placeholder="+1 676 767 6767"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">Rock name</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="name"
              type="text"
              placeholder="Pebble"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">
              Starting vibe
            </span>
            <select
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="startingVibe"
              defaultValue="chill"
            >
              <option value="chill">chill</option>
              <option value="dramatic">dramatic</option>
              <option value="crashing out">crashing out</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800">Timezone</span>
            <input
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
              name="timezone"
              type="text"
              placeholder="America/New_York"
            />
          </label>

          <button
            className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            type="submit"
          >
            Adopt my rock
          </button>
        </form>
      </main>
    </div>
  );
}

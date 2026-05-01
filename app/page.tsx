import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-14 text-zinc-950">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pet Rock
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Open the bot in Telegram, send /start, and follow the adoption prompts.
          </p>
        </div>

        <ol className="mt-8 space-y-4 text-sm leading-7 text-zinc-700">
          <li>1. Send /start to adopt a rock.</li>
          <li>2. Name your rock and choose a starting vibe.</li>
          <li>3. Tell it what city to use for your weather.</li>
          <li>
            4. Ask about the weather, rename it, pause updates, or reset from
            Telegram.
          </li>
        </ol>

        <a
          className="mt-8 block w-full rounded-xl bg-zinc-950 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-zinc-800"
          href={siteConfig.telegramUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open Telegram bot
        </a>

        <p className="mt-6 text-center text-xs text-zinc-500">
          by{" "}
          <a
            className="underline transition hover:text-zinc-800"
            href="https://github.com/benitolinito"
            rel="noreferrer"
            target="_blank"
          >
            benitolinito
          </a>
        </p>
      </section>
    </main>
  );
}

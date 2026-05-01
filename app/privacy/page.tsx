import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <Link
            className="inline-flex text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            href="/"
          >
            ← back
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Pet Rock Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500">Last updated: May 1, 2026</p>
          <p className="text-sm leading-7 text-zinc-700">
            This Privacy Policy explains how {siteConfig.legalName} collects,
            uses, and protects information submitted through the Pet Rock
            website and Telegram bot.
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Operator contact</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Pet Rock is operated by {siteConfig.operatorName}. Contact
              {" "}
              {siteConfig.supportEmail} for support. Support hours are{" "}
              {siteConfig.supportHours}. {siteConfig.supportResponseTime}
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Information we collect</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We collect Telegram identifiers, rock name, selected weather
              city, timezone, message history, and service metadata needed to
              deliver the Pet Rock experience and maintain account records.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How we use information</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We use this information to operate the Telegram bot, remember
              your rock, answer messages, provide weather-aware context,
              prevent abuse, and respond to support requests.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Telegram messages</h2>
            <p className="text-sm leading-7 text-zinc-700">
              You start the bot through Telegram and can pause or reset your
              rock using bot commands. Telegram may process your messages under
              its own terms and privacy policy.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Sharing</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We do not sell personal information. We may use service providers
              for hosting, messaging platform integration, weather data, LLM
              responses, and data storage solely to operate the service.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your choices</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Use /pause, /clear, or /unadopt in Telegram to control your rock
              and stored history. For privacy questions, contact{" "}
              {siteConfig.supportEmail}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

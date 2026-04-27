"use client";
import Link from "next/link";
import { useState } from "react";
import { sampleMessages, siteConfig, smsConsentDisclosure } from "@/lib/site";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [startingVibe, setStartingVibe] = useState("chill");
  const [timezone, setTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

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
          consentChecked,
        }),
      });

      const raw = await res.text();
      const data = raw ? (JSON.parse(raw) as { error?: string }) : {};

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setPhone("");
      setName("");
      setStartingVibe("chill");
      setConsentChecked(false);
      setSuccess("Your rock has been adopted. Check your phone.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit form.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 px-6 py-14 text-zinc-950">
      <main className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-stone-300 bg-white p-8 shadow-sm">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">
                Opt-in SMS application
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
                Adopt a pet rock that texts back.
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-700">
                {siteConfig.description} New signups receive a welcome message,
                day-to-day updates, and support for standard SMS keywords such
                as STOP and HELP.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-300 bg-white/80 p-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Program details
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Messages include onboarding texts, conversational replies, and
                  periodic weather-aware updates. Message frequency varies by
                  use.
                </p>
              </div>
              <div className="rounded-xl border border-stone-300 bg-white/80 p-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Project details
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {siteConfig.legalName}
                  <br />
                  Operated by {siteConfig.operatorName}
                  <br />
                  {siteConfig.projectType}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stone-300 bg-white/80 p-4">
                <h2 className="text-sm font-semibold text-zinc-900">Support</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Email {siteConfig.supportEmail}
                  <br />
                  {siteConfig.supportPhone}
                  <br />
                  {siteConfig.supportHours}
                  <br />
                  {siteConfig.supportResponseTime}
                </p>
              </div>
              <div className="rounded-xl border border-stone-300 bg-white/80 p-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Service status
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {siteConfig.launchDescription}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 bg-white/80 p-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                About the project
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-700">
                {siteConfig.about}
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-700">
                Pet Rock is operated by {siteConfig.operatorName}. Users join
                the program by voluntarily submitting the signup form on this
                website and agreeing to receive recurring SMS messages.
              </p>
            </div>

            <div className="rounded-xl border border-stone-300 bg-white/80 p-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                Consent and SMS terms
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-700">
                {smsConsentDisclosure}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-700">
                <Link className="underline" href="/terms">
                  Terms
                </Link>
                <Link className="underline" href="/privacy">
                  Privacy Policy
                </Link>
                <Link className="underline" href="/sms-policy">
                  SMS Policy
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 bg-white/80 p-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                How enrollment works
              </h2>
              <ol className="mt-3 space-y-2 text-sm leading-7 text-zinc-700">
                <li>1. Submit your mobile number and rock details.</li>
                <li>2. Check the consent box to join the SMS program.</li>
                <li>3. Receive a welcome text from your adopted rock.</li>
                <li>4. Reply STOP to opt out or HELP for help at any time.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-stone-300 bg-white/80 p-5">
              <h2 className="text-sm font-semibold text-zinc-900">
                Sample messages
              </h2>
              <div className="mt-3 space-y-3">
                {sampleMessages.map((message) => (
                  <p
                    key={message}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-zinc-700"
                  >
                    {message}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-300 bg-white/80 p-5">
              <h2 className="text-sm font-semibold text-zinc-900">FAQ</h2>
              <div className="mt-3 space-y-4 text-sm leading-7 text-zinc-700">
                <div>
                  <p className="font-medium text-zinc-900">
                    What messages will I receive?
                  </p>
                  <p>
                    Users receive a welcome message, conversational replies, and
                    periodic weather-aware updates after enrolling on the
                    website.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    How often will I hear from Pet Rock?
                  </p>
                  <p>
                    Message frequency varies based on the product flow and user
                    interaction.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    How do I stop messages?
                  </p>
                  <p>Reply STOP at any time to unsubscribe.</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">
                    How do I get help?
                  </p>
                  <p>
                    Reply HELP or contact {siteConfig.supportEmail} for support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Start your SMS signup
            </h2>
            <p className="text-sm leading-6 text-zinc-600">
              Enter your mobile number to enroll in the Pet Rock SMS program.
            </p>
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
              <span className="text-sm font-medium text-zinc-800">
                rock name
              </span>
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
              <span className="text-sm font-medium text-zinc-800">
                timezone
              </span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500"
                name="timezone"
                type="text"
                placeholder="America/New_York"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              <input
                className="mt-1 h-4 w-4 rounded border-zinc-300"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                required
              />
              <span>
                I agree to receive recurring conversational and service-related
                SMS messages from Pet Rock at the number I provided. Message
                frequency varies. Message and data rates may apply. Reply STOP
                to cancel and HELP for help. Consent is not a condition of
                purchase.{" "}
                <Link className="underline" href="/terms">
                  Terms
                </Link>{" "}
                <Link className="underline" href="/privacy">
                  Privacy Policy
                </Link>{" "}
                <Link className="underline" href="/sms-policy">
                  SMS Policy
                </Link>
                .
              </span>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? (
              <p className="text-sm text-green-700">{success}</p>
            ) : null}

            <button
              className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              type="submit"
              disabled={loading}
            >
              {loading ? "adopting..." : "adopt my rock"}
            </button>
          </form>
        </section>
      </main>
      <footer className="mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-stone-300 pt-5 text-sm text-zinc-600">
        <div>
          Operated by {siteConfig.operatorName}. Contact {siteConfig.supportEmail}.
        </div>
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/terms">
            Terms
          </Link>
          <Link className="underline" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="underline" href="/sms-policy">
            SMS Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

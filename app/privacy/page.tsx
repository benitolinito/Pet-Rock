import Link from "next/link";

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
          <p className="text-sm leading-7 text-zinc-700">
            Pet Rock collects the phone number, rock name, timezone, and
            message history needed to provide the SMS experience.
          </p>
          <p className="text-sm leading-7 text-zinc-700">
            We use this information to send messages, remember your rock&apos;s
            state, and operate the service. We do not sell your phone number or
            message history.
          </p>
          <p className="text-sm leading-7 text-zinc-700">
            You can opt out of SMS messages at any time by replying STOP to a
            Pet Rock message.
          </p>
        </div>
      </div>
    </main>
  );
}

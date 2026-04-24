import Link from "next/link";

export default function TermsPage() {
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
            Pet Rock Terms and SMS Program Terms
          </h1>
          <p className="text-sm leading-7 text-zinc-700">
            By signing up for Pet Rock, you agree to receive conversational and
            transactional SMS messages about your pet rock, including welcome
            messages, daily weather messages, and replies to your texts.
          </p>
          <p className="text-sm leading-7 text-zinc-700">
            Message frequency varies. Message and data rates may apply. Reply
            STOP to unsubscribe at any time. Reply HELP for help. Carriers are
            not liable for delayed or undelivered messages.
          </p>
          <p className="text-sm leading-7 text-zinc-700">
            Pet Rock is an SMS-first companion product. You consent to receive
            messages at the number you provide during signup.
          </p>
        </div>
      </div>
    </main>
  );
}

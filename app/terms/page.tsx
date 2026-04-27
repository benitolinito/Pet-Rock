import Link from "next/link";
import { siteConfig } from "@/lib/site";

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
            These Terms govern your use of the Pet Rock website and SMS
            program operated by {siteConfig.legalName}.
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Program description</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Pet Rock is an SMS-first companion service. By enrolling, you
              agree to receive recurring conversational and service-related text
              messages, including onboarding messages, replies, and periodic
              weather-themed updates.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Message frequency and fees</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Message frequency varies based on your activity and the program
              design. Message and data rates may apply according to your mobile
              carrier plan.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Opt-out and help</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Reply STOP to cancel. Reply START to resubscribe after opting out.
              Reply HELP for help. Carriers are not liable for delayed or
              undelivered messages.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Eligibility and use</h2>
            <p className="text-sm leading-7 text-zinc-700">
              You must provide a valid mobile number you are authorized to use.
              You agree not to use the service for abuse, fraud, or unlawful
              activity.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Support</h2>
            <p className="text-sm leading-7 text-zinc-700">
              For account or SMS support, contact {siteConfig.supportEmail}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

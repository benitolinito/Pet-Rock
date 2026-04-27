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
          <p className="text-sm leading-7 text-zinc-700">
            This Privacy Policy explains how {siteConfig.legalName} collects,
            uses, and protects information submitted through the Pet Rock
            website and SMS program.
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Information we collect</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We collect the mobile number, rock name, timezone, message
              history, consent timestamp, and service metadata needed to deliver
              the Pet Rock SMS experience and maintain account records.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How we use information</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We use this information to send requested text messages, manage
              subscriptions, provide customer support, prevent abuse, and
              operate the service.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">SMS consent</h2>
            <p className="text-sm leading-7 text-zinc-700">
              SMS consent is collected through the signup form on this website.
              Consent records are stored to document enrollment in the messaging
              program. You can opt out at any time by replying STOP.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Sharing</h2>
            <p className="text-sm leading-7 text-zinc-700">
              We do not sell personal information. We do not share mobile
              opt-in data or SMS consent with third parties for marketing
              purposes. We may use service providers that support hosting,
              messaging delivery, and data storage solely to operate the
              service.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your choices</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Reply STOP to unsubscribe from text messages. Reply HELP for help.
              For privacy questions, contact {siteConfig.supportEmail}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

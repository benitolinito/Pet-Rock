import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function SmsPolicyPage() {
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
            Pet Rock SMS Policy
          </h1>
          <p className="text-sm leading-7 text-zinc-700">
            Pet Rock sends recurring conversational and service-related SMS
            messages to users who sign up through this website.
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How to opt in</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Users opt in by completing the signup form on the Pet Rock
              website and checking the SMS consent box before submitting the
              form.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Message frequency</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Message frequency varies. Users may receive an initial welcome
              message, conversational responses, and periodic updates.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Fees</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Message and data rates may apply based on the user&apos;s mobile
              carrier plan.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Opt out</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Reply STOP to any message to opt out. After opting out, you will
              no longer receive messages unless you later reply START to
              resubscribe.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Help</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Reply HELP for help or contact {siteConfig.supportEmail}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

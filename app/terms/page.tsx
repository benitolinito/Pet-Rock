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
            Pet Rock Terms
          </h1>
          <p className="text-sm text-zinc-500">Last updated: May 1, 2026</p>
          <p className="text-sm leading-7 text-zinc-700">
            These Terms govern your use of the Pet Rock website and Telegram
            bot operated by {siteConfig.legalName}.
          </p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Project identity</h2>
            <p className="text-sm leading-7 text-zinc-700">
              {siteConfig.legalName} is operated by {siteConfig.operatorName}
              as an {siteConfig.projectType.toLowerCase()}. Support contact:
              {" "}
              {siteConfig.supportEmail}.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Program description</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Pet Rock is a Telegram companion bot. You can adopt a virtual pet
              rock, chat with it, set a weather city, and receive Telegram
              messages from your rock.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Messages and availability</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Message frequency may vary based on your activity and product
              behavior. The service may change, pause, or become unavailable
              while the project is under development.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Controls and help</h2>
            <p className="text-sm leading-7 text-zinc-700">
              Use Telegram commands such as /pause, /start, /settings,
              /clear, and /unadopt to control your rock. Contact{" "}
              {siteConfig.supportEmail} for support.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Eligibility and use</h2>
            <p className="text-sm leading-7 text-zinc-700">
              You agree not to use the service for abuse, fraud, unlawful
              activity, or attempts to disrupt the bot or its underlying
              services.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Support</h2>
            <p className="text-sm leading-7 text-zinc-700">
              For account or bot support, contact {siteConfig.supportEmail}.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using NextWallStreet products and services.",
};

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 text-bone">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">NextWallStreet · Legal</p>
      <h1 className="mt-3 font-display text-4xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted">Effective November 14, 2026</p>
      <div className="mt-10 space-y-7 text-sm leading-7 text-muted">
        <section><h2 className="text-lg font-semibold text-bone">Using the service</h2><p>You may browse publicly available pages without an account. You are responsible for keeping your account credentials secure and for activity under your account. Do not misuse, disrupt, or attempt to gain unauthorized access to the service.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">Market information</h2><p>NextWallStreet provides general market information, research, and educational material. It is not investment, legal, tax, or financial advice, and it is not an offer or recommendation to buy or sell any security or digital asset. Markets involve risk; make independent decisions and consult a qualified professional where appropriate.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">Paid access and account records</h2><p>Some features require a verified purchase. Payment processing and purchase verification may be provided by third parties, including Whop. Access is granted based on verified payment status and may be suspended if a membership is canceled, refunded, or invalidated.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">Changes and contact</h2><p>We may update the service or these terms. Material changes will be reflected here with an updated effective date. Questions may be sent to <a className="text-gold-bright underline" href="mailto:support@nextwallstreet.com">support@nextwallstreet.com</a>.</p></section>
        <p className="rounded-xl border border-gold/20 bg-ink-900 p-4 text-xs">These terms are a starting point and should be reviewed by qualified counsel for your operating jurisdictions before production use.</p>
      </div>
    </article>
  );
}

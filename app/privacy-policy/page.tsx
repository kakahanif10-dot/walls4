import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NextWallStreet handles account, watchlist, and purchase information.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 text-bone">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">NextWallStreet · Legal</p>
      <h1 className="mt-3 font-display text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted">Effective November 14, 2026</p>
      <div className="mt-10 space-y-7 text-sm leading-7 text-muted">
        <section><h2 className="text-lg font-semibold text-bone">Information we collect</h2><p>When you create an account, we process your email address and any profile details you provide. If you use account features, we store your saved watchlist. When you purchase access, our payment provider may send us membership and transaction status needed to verify your entitlement.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">How we use information</h2><p>We use this information to operate and secure accounts, synchronize your preferences to your Firebase account, verify purchases, provide support, and maintain required consent and service records. Account data is private to your account; it is not shared with other customers. We do not use your watchlist to place trades.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">Service providers and retention</h2><p>We rely on Firebase Authentication and Firestore for account and saved-preference services, and Whop for payment processing and purchase verification. We retain account and transaction-related records for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce our agreements.</p></section>
        <section><h2 className="text-lg font-semibold text-bone">Your choices and contact</h2><p>You may use the public portions of the site without signing in. You can request access, correction, or deletion of account information by emailing <a className="text-gold-bright underline" href="mailto:support@nextwallstreet.com">support@nextwallstreet.com</a>, subject to records we must retain by law.</p></section>
        <p className="rounded-xl border border-gold/20 bg-ink-900 p-4 text-xs">This policy is a product disclosure and should be reviewed by qualified counsel for your operating jurisdictions before production use.</p>
      </div>
    </article>
  );
}

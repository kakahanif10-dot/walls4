import type { Metadata } from "next";
import { AccountSetupForm } from "@/components/account-setup-form";

export const metadata: Metadata = {
  title: "Set up your account",
  description: "Finish setting up your NextWall Street lifetime research account.",
  robots: { index: false, follow: false },
};

export default function AccountSetupPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
      <div className="mb-8 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Lifetime membership</p>
        <h1 className="mt-3 font-display text-4xl text-bone sm:text-5xl">Set up your account</h1>
        <p className="mt-4 text-sm leading-6 text-bone/65">
          Your Whop payment is linked to the email address used at checkout. Create a password to finish setup.
        </p>
      </div>
      <AccountSetupForm />
    </main>
  );
}

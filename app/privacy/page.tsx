import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — drrop.io",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export default function PrivacyPage() {
  return (
    <div
      className={`${dmSans.variable} ${dmSerif.variable} min-h-screen bg-[#0a0a0a] text-[#e8e8e8]`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 300, lineHeight: 1.8 }}
    >
      <header className="flex items-center justify-between border-b border-[#222] px-10 py-8">
        <a
          href="https://drrop.io"
          className="text-[#c8f55a] no-underline"
          style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: "1.4rem", letterSpacing: "-0.02em" }}
        >
          drrop
        </a>
        <a
          href="https://drrop.io"
          className="text-[#666] uppercase transition-colors hover:text-[#e8e8e8]"
          style={{ fontSize: "0.8rem", letterSpacing: "0.08em" }}
        >
          ← Back to app
        </a>
      </header>

      <div className="mx-auto max-w-[720px] px-10 pb-32 pt-20">
        <p
          className="mb-6 uppercase text-[#c8f55a]"
          style={{ fontSize: "0.75rem", letterSpacing: "0.15em" }}
        >
          Legal
        </p>

        <h1
          className="mb-4 leading-[1.1] text-[#e8e8e8]"
          style={{
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
            letterSpacing: "-0.03em",
          }}
        >
          Privacy Policy
        </h1>

        <p
          className="mb-16 border-b border-[#222] pb-8 text-[#666]"
          style={{ fontSize: "0.85rem" }}
        >
          Last updated: June 1, 2025 &thinsp;·&thinsp; Effective immediately
        </p>

        <div
          className="my-8 border border-[#222] border-l-[3px] border-l-[#c8f55a] bg-[#111] px-6 py-5 text-[#aaa]"
          style={{ fontSize: "0.9rem" }}
        >
          Drrop is a tool for uploading videos to YouTube in bulk. We collect only what&apos;s
          necessary to make the service work and never sell your data.
        </div>

        <Section title="1. Who We Are">
          <p>
            Drrop (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by Shimal Dhanjee. Our service is
            accessible at{" "}
            <a href="https://drrop.io" className="text-[#c8f55a] hover:underline">
              drrop.io
            </a>
            . If you have questions about this policy, contact us at{" "}
            <a href="mailto:support@drrop.io" className="text-[#c8f55a] hover:underline">
              support@drrop.io
            </a>
            .
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following information when you use Drrop:</p>
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Account information:</strong> Your name
              and email address provided through Google Sign-In.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Google OAuth tokens:</strong> Access
              tokens that allow Drrop to upload videos to your YouTube channel on your behalf. These
              are stored securely and never shared.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Usage data:</strong> Upload history,
              credit balance, and session information stored in our database.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Payment information:</strong> Stripe
              processes all payments. We do not store your credit card details.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Video files:</strong> Videos you upload
              are sent directly to YouTube via the YouTube Data API. We do not permanently store your
              video files.
            </li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">Authenticate you and manage your account</li>
            <li className="mb-1.5">Upload videos to YouTube on your behalf</li>
            <li className="mb-1.5">Track your credit usage and upload history</li>
            <li className="mb-1.5">Process payments and issue receipts</li>
            <li className="mb-1.5">
              Send transactional emails (upload confirmations, low credit alerts)
            </li>
            <li className="mb-1.5">Improve the service and diagnose technical issues</li>
          </ul>
        </Section>

        <Section title="4. Google API & YouTube Data">
          <p>Drrop uses the YouTube Data API v3. By signing in with Google, you grant Drrop permission to:</p>
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">View your YouTube channel information</li>
            <li className="mb-1.5">Upload videos to your YouTube account</li>
            <li className="mb-1.5">Manage video metadata (titles, descriptions, privacy settings)</li>
          </ul>
          <p>
            Drrop&apos;s use and transfer of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c8f55a] hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p>
            You can revoke Drrop&apos;s access to your Google account at any time through your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c8f55a] hover:underline"
            >
              Google Account permissions page
            </a>
            .
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Google / YouTube:</strong> To fulfill
              upload requests on your behalf.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Stripe:</strong> For payment
              processing.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Supabase:</strong> Our database and
              authentication provider.
            </li>
            <li className="mb-1.5">
              <strong className="text-[#e8e8e8] font-medium">Vercel:</strong> Our hosting
              infrastructure.
            </li>
          </ul>
          <p>
            All third-party providers are bound by their own privacy policies and data processing
            agreements.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account data for as long as your account is active. Upload logs are
            retained for 90 days. You may request deletion of your account and associated data at
            any time by emailing{" "}
            <a href="mailto:support@drrop.io" className="text-[#c8f55a] hover:underline">
              support@drrop.io
            </a>
            .
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We use industry-standard practices to protect your data, including encrypted connections
            (HTTPS), secure token storage, and row-level security on our database. No method of
            transmission over the internet is 100% secure, and we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            Drrop is not intended for users under the age of 13. We do not knowingly collect
            personal information from children.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by posting the new policy on this page with an updated date. Continued use of
            the service after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For privacy-related questions or data deletion requests, contact us at{" "}
            <a href="mailto:support@drrop.io" className="text-[#c8f55a] hover:underline">
              support@drrop.io
            </a>
            .
          </p>
        </Section>
      </div>

      <footer
        className="border-t border-[#222] py-8 text-center text-[#666]"
        style={{ fontSize: "0.8rem" }}
      >
        © 2025 Drrop ·{" "}
        <Link href="/privacy" className="text-[#c8f55a] hover:underline">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="text-[#c8f55a] hover:underline">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-12">
      <h2
        className="mb-4 text-[#e8e8e8]"
        style={{
          fontFamily: "var(--font-dm-serif), serif",
          fontSize: "1.4rem",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      <div className="space-y-4 text-[#aaa]" style={{ fontSize: "0.95rem" }}>
        {children}
      </div>
    </div>
  );
}

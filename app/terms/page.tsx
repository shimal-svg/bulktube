import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — drrop.io",
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

export default function TermsPage() {
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
          Terms of Service
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
          By using Drrop, you agree to these terms. Please read them. They&apos;re written in plain
          English.
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Drrop (&quot;the Service&quot;) at drrop.io, you agree to be bound by
            these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Drrop is a web-based tool that allows users to upload multiple videos to YouTube
            simultaneously. The Service uses the YouTube Data API v3 to upload videos on your
            behalf. Drrop operates on a credit-based model: new users receive 3 free uploads, and
            additional uploads require purchasing credit packs.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least 13 years old to use Drrop. By using the Service, you represent
            that you meet this requirement and have the legal capacity to enter into these Terms.
          </p>
        </Section>

        <Section title="4. Account & Authentication">
          <p>
            Drrop uses Google Sign-In for authentication. You are responsible for maintaining the
            security of your Google account. You agree to notify us immediately if you suspect
            unauthorized access to your account. We are not liable for losses resulting from
            unauthorized use of your account.
          </p>
        </Section>

        <Section title="5. Credits & Payments">
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">New accounts receive 3 free upload credits upon registration.</li>
            <li className="mb-1.5">Additional credits are purchased in packs via Stripe.</li>
            <li className="mb-1.5">1 credit = 1 video upload to YouTube.</li>
            <li className="mb-1.5">
              Credits are non-refundable once purchased, except as required by applicable law.
            </li>
            <li className="mb-1.5">Credit packs do not expire.</li>
            <li className="mb-1.5">All prices are in USD and subject to change with notice.</li>
          </ul>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You agree not to use Drrop to upload content that:</p>
          <ul className="mb-4 ml-5 mt-2 list-disc text-[#aaa]" style={{ fontSize: "0.95rem" }}>
            <li className="mb-1.5">
              Violates YouTube&apos;s Terms of Service or Community Guidelines
            </li>
            <li className="mb-1.5">
              Infringes on any copyright, trademark, or intellectual property rights
            </li>
            <li className="mb-1.5">
              Contains illegal content, hate speech, or material that exploits minors
            </li>
            <li className="mb-1.5">Is spam, deceptive, or misleading</li>
            <li className="mb-1.5">
              Violates any applicable local, state, national, or international law
            </li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </Section>

        <Section title="7. YouTube API & Google Terms">
          <p>
            By using Drrop, you also agree to be bound by the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c8f55a] hover:underline"
            >
              YouTube Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c8f55a] hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>
            . Your use of YouTube&apos;s services through Drrop is subject to YouTube&apos;s policies.
            Drrop is not affiliated with or endorsed by YouTube or Google.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            You retain full ownership of all video content you upload through Drrop. By using the
            Service, you grant Drrop a limited, non-exclusive license to process and transmit your
            content solely for the purpose of uploading it to YouTube on your behalf.
          </p>
          <p>
            The Drrop name, logo, and interface are owned by us. You may not use them without our
            written permission.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            Drrop is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
            express or implied. We do not warrant that the Service will be uninterrupted,
            error-free, or that uploads will always succeed. YouTube API availability and quotas are
            outside our control.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Drrop shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, including loss of profits,
            data, or goodwill, arising from your use of the Service. Our total liability to you for
            any claims shall not exceed the amount you paid us in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="11. Indemnification">
          <p>
            You agree to indemnify and hold harmless Drrop and its operators from any claims,
            damages, or expenses arising from your use of the Service, your content, or your
            violation of these Terms.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            We may suspend or terminate your account at any time for violation of these Terms. You
            may delete your account at any time by contacting{" "}
            <a href="mailto:support@drrop.io" className="text-[#c8f55a] hover:underline">
              support@drrop.io
            </a>
            . Upon termination, your unused credits are forfeited.
          </p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes by
            posting the updated Terms on this page with a new effective date. Continued use of the
            Service after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="14. Governing Law">
          <p>
            These Terms are governed by the laws of the State of California, without regard to
            conflict of law principles. Any disputes shall be resolved in the courts of Los Angeles
            County, California.
          </p>
        </Section>

        <Section title="15. Contact">
          <p>
            For questions about these Terms, contact us at{" "}
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

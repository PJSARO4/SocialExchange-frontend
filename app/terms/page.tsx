export const metadata = {
  title: "Terms of Service — Social Exchange",
  description:
    "The Terms of Service governing use of the Social Exchange marketplace, escrow system, and E-Shares / Community Credits.",
};

const LAST_UPDATED = "July 2026";
const CONTACT_EMAIL = "support@socialexchange.com";
const LEGAL_EMAIL = "legal@socialexchange.com";
const GOVERNING_LAW = "[State / Country — to be confirmed by counsel]";

export default function TermsOfService() {
  return (
    <main className="legal-root">
      <style>{legalStyles}</style>

      <div className="legal-shell">
        <div className="legal-panel">
          <header className="legal-header">
            <p className="legal-kicker">SOCIAL • EXCHANGE</p>
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-meta">Last updated: {LAST_UPDATED}</p>
            <p className="legal-note">
              This document is a template provided for informational purposes only and must be
              reviewed and adapted by qualified legal counsel before it is relied upon in
              production.
            </p>
          </header>

          <section className="legal-section">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
              Social Exchange platform (the &ldquo;Service&rdquo;), operated by Social Exchange
              (&ldquo;Social Exchange,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              Social Exchange is an online marketplace where users may list, discover, buy, and sell
              social media accounts and audiences (&ldquo;feeds&rdquo;), primarily on Instagram, using
              an escrow-based settlement process and an in-platform credit called &ldquo;E-Shares&rdquo;
              or &ldquo;Community Credits.&rdquo;
            </p>
            <p>
              By creating an account or using the Service, you agree to be bound by these Terms and by
              our Privacy Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Eligibility (18+)</h2>
            <p>
              You must be at least 18 years old and capable of forming a binding contract to use the
              Service. By using Social Exchange, you represent and warrant that you meet these
              requirements and that all information you provide is accurate. The Service is not
              directed to and may not be used by anyone under 18.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Accounts &amp; Account Security</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your login credentials;</li>
              <li>You are responsible for all activity that occurs under your account;</li>
              <li>You must provide accurate registration information and keep it up to date;</li>
              <li>
                You must promptly notify us of any unauthorized use of your account or other security
                breach;
              </li>
              <li>
                You may not create accounts by automated means, share accounts, or maintain more than
                one account without our permission.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. The Marketplace &amp; Escrow Model</h2>
            <p>
              Social Exchange provides a venue that connects buyers and sellers of social media
              accounts and feeds. Except where expressly stated, we are not a party to transactions
              between users; buyers and sellers contract directly with one another.
            </p>
            <ul>
              <li>
                <strong>Listings.</strong> Sellers are responsible for the accuracy of their listings,
                including audience metrics, follower counts, engagement figures, and ownership of the
                account or feed being offered.
              </li>
              <li>
                <strong>Escrow.</strong> To reduce risk, transactions may be completed through our
                escrow process, under which the buyer&rsquo;s funds or credits are held and released to
                the seller only after the agreed transfer conditions are met and any applicable
                inspection or verification window has passed.
              </li>
              <li>
                <strong>Fees.</strong> We may charge marketplace, escrow, or processing fees, which
                will be disclosed before you complete a transaction.
              </li>
              <li>
                <strong>Disputes.</strong> If a dispute arises, you agree to cooperate with our
                dispute-resolution process. We may, at our discretion, hold, release, or refund funds
                or credits based on the evidence provided, but we are not obligated to resolve
                disputes between users.
              </li>
              <li>
                <strong>Platform compliance.</strong> You are solely responsible for ensuring that any
                sale, purchase, or transfer of a social media account complies with the terms of the
                relevant platform (such as Meta / Instagram). Such platforms may restrict or prohibit
                account transfers, and we make no representation that any transaction is permitted by
                them.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. E-Shares / Community Credits</h2>
            <p>
              &ldquo;E-Shares,&rdquo; also referred to as &ldquo;Community Credits,&rdquo; are a
              USD-denominated, in-platform credit used to facilitate transactions on Social Exchange.
              You acknowledge and agree that:
            </p>
            <ul>
              <li>
                E-Shares are a limited-purpose digital credit for use within the Service and are{" "}
                <strong>not securities, investment products, deposits, e-money, or legal tender</strong>;
              </li>
              <li>
                E-Shares do not accrue interest, confer ownership or equity in Social Exchange, and
                carry no rights other than those expressly described in these Terms;
              </li>
              <li>
                E-Shares have no value outside the Service, are not transferable except as permitted by
                the Service, and may be subject to limits, holds, or expiration as described at the
                time of issuance;
              </li>
              <li>
                We may adjust, correct, suspend, or reverse E-Shares balances to address errors, fraud,
                chargebacks, or violations of these Terms;
              </li>
              <li>
                Any redemption or cash-out of E-Shares, where offered, is subject to verification,
                applicable fees, and applicable law.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Misrepresent the ownership, metrics, or history of any account or feed;</li>
              <li>
                List, sell, or purchase accounts that are stolen, fraudulently obtained, use fake or
                bot-generated followers, or otherwise violate a platform&rsquo;s terms;
              </li>
              <li>Engage in fraud, money laundering, or any unlawful activity;</li>
              <li>
                Circumvent the escrow process, attempt to complete transactions off-platform to avoid
                fees or protections, or manipulate pricing or reviews;
              </li>
              <li>Upload malware, scrape the Service, or interfere with its operation or security;</li>
              <li>
                Infringe intellectual-property rights or post unlawful, harassing, or infringing
                content;
              </li>
              <li>Use the Service in violation of any applicable law, regulation, or third-party terms.</li>
            </ul>
            <p>
              We may investigate suspected violations and take action including removing listings,
              holding funds, and suspending or terminating accounts.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Platforms</h2>
            <p>
              The Service integrates with third-party platforms, including Meta (Instagram / Facebook)
              via their APIs, and payment providers such as Stripe. Your use of those platforms is
              governed by their own terms and policies. We are not responsible for the availability,
              actions, or policies of any third-party platform, including any decision by such a
              platform to suspend, restrict, or terminate an account.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT
              WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. We do not
              warrant that the Service will be uninterrupted, secure, or error-free, that listings or
              metrics are accurate, or that any transaction between users will be completed. You use
              the Service, and transact with other users, at your own risk.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOCIAL EXCHANGE AND ITS OFFICERS, EMPLOYEES, AND
              AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR ACCOUNTS,
              ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE. OUR TOTAL AGGREGATE LIABILITY FOR
              ANY CLAIM RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES YOU
              PAID TO US IN THE THREE (3) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B)
              ONE HUNDRED U.S. DOLLARS (USD $100). SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS,
              SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Social Exchange from any claims, losses,
              liabilities, and expenses (including reasonable attorneys&rsquo; fees) arising out of
              your use of the Service, your listings or transactions, your violation of these Terms, or
              your violation of any law or third-party right.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Termination</h2>
            <p>
              You may stop using the Service and close your account at any time. We may suspend or
              terminate your access to the Service, remove listings, or withhold funds or credits if we
              reasonably believe you have violated these Terms, created risk or legal exposure, or
              engaged in fraudulent or unlawful conduct. Upon termination, provisions that by their
              nature should survive &mdash; including sections on E-Shares, disclaimers, limitation of
              liability, indemnification, and governing law &mdash; will survive.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of {GOVERNING_LAW}, without regard to its
              conflict-of-laws rules. Any dispute arising out of or relating to these Terms or the
              Service will be resolved in the courts located in {GOVERNING_LAW}, unless a binding
              arbitration or alternative dispute-resolution provision is separately agreed. This
              placeholder must be finalized by legal counsel.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Changes to These Terms</h2>
            <p>
              We may modify these Terms from time to time. When we make material changes, we will
              update the &ldquo;Last updated&rdquo; date above and, where appropriate, provide
              additional notice. Your continued use of the Service after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Contact</h2>
            <p>
              For questions about these Terms or the Service, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. For legal notices, contact{" "}
              <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
            </p>
          </section>

          <footer className="legal-footer">
            <span className="legal-status">SYSTEM ONLINE</span>
            <span className="legal-footer-sep">//</span>
            <span>Social Exchange &mdash; Terms of Service &mdash; {LAST_UPDATED}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

const legalStyles = `
  .legal-root {
    --le-void: #01020a;
    --le-cyan: #00f0ff;
    --le-cyan-soft: rgba(0, 240, 255, 0.7);
    --le-line: rgba(0, 240, 255, 0.14);
    --le-text: rgba(255, 255, 255, 0.9);
    --le-text-muted: rgba(255, 255, 255, 0.55);
    --le-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
    --le-display: 'Orbitron', var(--le-mono);
    --le-base: 'Inter', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    width: 100%;
    overflow-y: auto;
    background:
      radial-gradient(ellipse 80% 60% at 20% 0%, rgba(99, 102, 241, 0.10), transparent 55%),
      radial-gradient(ellipse 70% 60% at 90% 100%, rgba(0, 240, 255, 0.06), transparent 55%),
      var(--le-void);
    color: var(--le-text);
    font-family: var(--le-base);
    -webkit-font-smoothing: antialiased;
  }

  .legal-shell {
    max-width: 860px;
    margin: 0 auto;
    padding: 64px 24px 96px;
  }

  .legal-panel {
    background: rgba(4, 10, 24, 0.72);
    border: 1px solid var(--le-line);
    border-radius: 14px;
    padding: 48px 44px;
    box-shadow:
      0 0 40px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .legal-header {
    border-bottom: 1px solid var(--le-line);
    padding-bottom: 28px;
    margin-bottom: 32px;
  }

  .legal-kicker {
    font-family: var(--le-mono);
    font-size: 11px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: var(--le-cyan-soft);
    margin-bottom: 14px;
  }

  .legal-title {
    font-family: var(--le-display);
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    text-shadow: 0 0 24px rgba(0, 240, 255, 0.22);
    margin-bottom: 12px;
  }

  .legal-meta {
    font-family: var(--le-mono);
    font-size: 12px;
    letter-spacing: 0.14em;
    color: var(--le-text-muted);
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .legal-note {
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--le-text-muted);
    font-style: italic;
    border-left: 2px solid var(--le-line);
    padding-left: 14px;
  }

  .legal-section {
    margin-bottom: 30px;
  }

  .legal-section h2 {
    font-family: var(--le-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--le-cyan);
    margin-bottom: 12px;
  }

  .legal-section h3 {
    font-family: var(--le-mono);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.82);
    text-transform: uppercase;
    margin: 20px 0 8px;
  }

  .legal-section p {
    font-size: 14.5px;
    line-height: 1.75;
    color: var(--le-text);
    margin-bottom: 12px;
  }

  .legal-section ul {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
  }

  .legal-section li {
    position: relative;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.82);
    padding-left: 20px;
    margin-bottom: 8px;
  }

  .legal-section li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 11px;
    width: 5px;
    height: 5px;
    background: var(--le-cyan);
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
    border-radius: 50%;
  }

  .legal-section a {
    color: var(--le-cyan);
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 240, 255, 0.35);
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .legal-section a:hover {
    color: #fff;
    border-color: var(--le-cyan);
  }

  .legal-section strong {
    color: #fff;
    font-weight: 600;
  }

  .legal-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    padding-top: 24px;
    border-top: 1px solid var(--le-line);
    font-family: var(--le-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    color: var(--le-text-muted);
    text-transform: uppercase;
  }

  .legal-status {
    color: #00ff88;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
  }

  .legal-footer-sep {
    opacity: 0.4;
  }

  @media (max-width: 640px) {
    .legal-shell { padding: 40px 14px 72px; }
    .legal-panel { padding: 32px 22px; }
    .legal-title { font-size: 26px; }
  }
`;

export const metadata = {
  title: "Privacy Policy — Social Exchange",
  description:
    "How Social Exchange collects, uses, shares, and protects your information, including data obtained through the Meta / Instagram Graph API.",
};

const LAST_UPDATED = "July 2026";
const CONTACT_EMAIL = "privacy@socialexchange.com";

export default function PrivacyPolicy() {
  return (
    <main className="legal-root">
      <style>{legalStyles}</style>

      <div className="legal-shell">
        <div className="legal-panel">
          <header className="legal-header">
            <p className="legal-kicker">SOCIAL • EXCHANGE</p>
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-meta">Last updated: {LAST_UPDATED}</p>
            <p className="legal-note">
              This document is a template provided for informational purposes only and must be
              reviewed and adapted by qualified legal counsel before it is relied upon in
              production.
            </p>
          </header>

          <section className="legal-section">
            <p>
              Social Exchange (&ldquo;Social Exchange,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) operates an online marketplace where users may list, discover, buy,
              and sell social media accounts and audiences (&ldquo;feeds&rdquo;), primarily on
              Instagram, using an escrow-based settlement system and an in-platform, USD-denominated
              credit called &ldquo;E-Shares&rdquo; or &ldquo;Community Credits.&rdquo; This Privacy
              Policy explains what information we collect, how we use it, when we share it, how long
              we keep it, and the choices and rights available to you.
            </p>
            <p>
              By creating an account, connecting a social media profile, or otherwise using the
              Social Exchange platform (the &ldquo;Service&rdquo;), you acknowledge that you have
              read and understood this Privacy Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Information We Collect</h2>

            <h3>1.1 Account &amp; Contact Information</h3>
            <p>When you register for and use the Service, we collect:</p>
            <ul>
              <li>Your name, username, and email address;</li>
              <li>Authentication credentials and, where applicable, hashed passwords;</li>
              <li>
                Account preferences, settings, and communications you send to us (including support
                requests).
              </li>
            </ul>

            <h3>1.2 Instagram &amp; Facebook Data (Meta Graph API)</h3>
            <p>
              When you choose to connect an Instagram or Facebook account, you authorize us, through
              Meta&rsquo;s OAuth flow, to access certain data via the Instagram Graph API and
              Facebook Graph API. Depending on the permissions you grant, this may include:
            </p>
            <ul>
              <li>
                Public profile information (such as your Instagram/Facebook user ID, username,
                display name, profile picture, biography, and website);
              </li>
              <li>Account-type information (for example, whether the account is a business or creator account);</li>
              <li>Follower and following counts and other audience metrics;</li>
              <li>
                Media you have published (photos, videos, captions, and associated metadata such as
                timestamps and permalinks);
              </li>
              <li>
                Insights and analytics (such as reach, impressions, engagement, and other aggregate
                performance metrics made available by Meta);
              </li>
              <li>
                OAuth access tokens that allow us to maintain the connection you have authorized.
              </li>
            </ul>
            <p>
              We only request the permissions necessary to provide marketplace, listing, and
              verification features, and we never ask for or store your Instagram or Facebook
              password.
            </p>

            <h3>1.3 Transaction &amp; Financial Information</h3>
            <ul>
              <li>
                Records of listings, offers, purchases, sales, escrow holds, releases, refunds, and
                E-Shares / Community Credits balances and transfers;
              </li>
              <li>
                Limited billing information processed by our payment provider (we do not store full
                card numbers on our own servers);
              </li>
              <li>Dispute, chargeback, and fraud-prevention records.</li>
            </ul>

            <h3>1.4 Technical &amp; Usage Data</h3>
            <ul>
              <li>Device, browser, and operating-system information;</li>
              <li>IP address, approximate location derived from IP, and log data;</li>
              <li>
                Pages viewed, features used, referring URLs, and interactions collected through
                cookies and similar technologies.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use the information described above to:</p>
            <ul>
              <li>Create, operate, secure, and maintain your account and the Service;</li>
              <li>
                Display listings, verify ownership and authenticity of connected accounts, and show
                audience metrics and insights to relevant parties in a transaction;
              </li>
              <li>
                Facilitate marketplace transactions, including escrow holds and releases and the
                issuance and settlement of E-Shares / Community Credits;
              </li>
              <li>Process payments, prevent fraud, and enforce our Terms of Service;</li>
              <li>Provide customer support and respond to your requests;</li>
              <li>
                Analyze usage to improve, troubleshoot, and develop features (in aggregate or
                de-identified form wherever practical);
              </li>
              <li>
                Send you transactional and administrative messages and, where permitted, product
                updates you may opt out of;
              </li>
              <li>Comply with legal obligations and enforce our legal rights.</li>
            </ul>
            <p>
              We do not sell your personal information, and we do not use Meta Platform Data for any
              purpose other than to provide and improve the Service in accordance with Meta&rsquo;s
              Platform Terms and Developer Policies.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. How We Share Information &amp; Third-Party Services</h2>
            <p>
              We share information only as described here. We rely on the following categories of
              third parties:
            </p>
            <ul>
              <li>
                <strong>Meta Platforms, Inc.</strong> (Instagram / Facebook) &mdash; to authenticate
                you and retrieve the account data you authorize via the Graph API. Your use of Meta
                products remains subject to Meta&rsquo;s own privacy policy.
              </li>
              <li>
                <strong>Payment processors (e.g., Stripe)</strong> &mdash; to process payments,
                payouts, and refunds. These providers handle card and banking data under their own
                privacy policies.
              </li>
              <li>
                <strong>Hosting &amp; infrastructure providers</strong> &mdash; to host our
                application, databases, and backups securely.
              </li>
              <li>
                <strong>Other marketplace participants</strong> &mdash; when you list or transact,
                limited listing and metric information is shared with counterparties to the extent
                necessary to complete a transaction.
              </li>
              <li>
                <strong>Legal &amp; safety</strong> &mdash; to comply with law, respond to lawful
                requests, protect our rights, or prevent fraud or harm.
              </li>
              <li>
                <strong>Business transfers</strong> &mdash; in connection with a merger, acquisition,
                or sale of assets, subject to this Privacy Policy.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Data Retention</h2>
            <p>
              We retain personal information for as long as your account is active and as needed to
              provide the Service. After account closure, we retain certain information as required
              to comply with legal, tax, accounting, dispute-resolution, and fraud-prevention
              obligations, after which it is deleted or anonymized. Instagram / Facebook OAuth tokens
              are deleted when you disconnect the relevant account or when they expire or are revoked.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Data Deletion &amp; Your Choices</h2>
            <p>
              You can disconnect any connected Instagram or Facebook account at any time from your
              account settings, which revokes the associated OAuth token and stops further data
              access. You may also request deletion of your personal information, including data
              obtained through the Meta Graph API.
            </p>
            <p>
              To request deletion of your account and associated data, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject line
              &ldquo;Data Deletion Request.&rdquo; We will verify your identity and process eligible
              requests within a reasonable time, subject to information we are legally required to
              retain. You may also manage or remove Social Exchange&rsquo;s access to your Meta
              accounts directly from your Facebook or Instagram app settings under &ldquo;Apps and
              Websites.&rdquo;
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Cookies &amp; Similar Technologies</h2>
            <p>
              We use cookies and similar technologies to keep you signed in, remember preferences,
              secure the Service, and understand how the Service is used. You can control cookies
              through your browser settings; disabling certain cookies may limit functionality such
              as staying logged in.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Data Security</h2>
            <p>
              We implement technical and organizational measures designed to protect your
              information, including encryption of sensitive data such as OAuth tokens, restricted
              access controls, and secure transmission. No method of storage or transmission is
              completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Children&rsquo;s Privacy (18+)</h2>
            <p>
              The Service is intended solely for adults. You must be at least 18 years old to use
              Social Exchange. We do not knowingly collect personal information from anyone under 18.
              If we learn that we have collected information from a person under 18, we will delete
              it and terminate the associated account. If you believe a minor has provided us with
              personal information, please contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. International Users</h2>
            <p>
              We may process and store information in the United States and other countries. By using
              the Service, you understand that your information may be transferred to jurisdictions
              that may have different data-protection rules than your own.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we
              will update the &ldquo;Last updated&rdquo; date above and, where appropriate, provide
              additional notice. Your continued use of the Service after changes take effect
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have questions or requests regarding this Privacy Policy or your data, contact
              our privacy team at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <footer className="legal-footer">
            <span className="legal-status">SYSTEM ONLINE</span>
            <span className="legal-footer-sep">//</span>
            <span>Social Exchange &mdash; Privacy Policy &mdash; {LAST_UPDATED}</span>
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

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: 1.6,
      color: '#333'
    }}>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

      <h2>Introduction</h2>
      <p>
        Social Exchange ("we", "our", or "us") is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, and safeguard your information
        when you use our social media management platform.
      </p>

      <h2>Information We Collect</h2>
      <p>When you connect your social media accounts, we collect:</p>
      <ul>
        <li>Basic profile information (name, username, profile picture)</li>
        <li>Account metrics (follower counts, engagement rates)</li>
        <li>Content you choose to schedule or post through our platform</li>
        <li>OAuth tokens to maintain your account connections</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Display your social media analytics</li>
        <li>Schedule and publish content on your behalf</li>
        <li>Provide automation features you enable</li>
        <li>Improve our services</li>
      </ul>

      <h2>Data Storage & Security</h2>
      <p>
        Your data is stored securely and we implement appropriate technical measures
        to protect against unauthorized access. OAuth tokens are encrypted and we
        never store your social media passwords.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        We integrate with Meta (Instagram/Facebook) APIs to provide our services.
        Your use of these platforms is also subject to their respective privacy policies.
      </p>

      <h2>Data Deletion</h2>
      <p>
        You can disconnect your social media accounts at any time, which will remove
        your OAuth tokens from our system. To request complete data deletion,
        contact us at the email below.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, please contact us at:{' '}
        <a href="mailto:pjsaro4@gmail.com">pjsaro4@gmail.com</a>
      </p>
    </div>
  );
}

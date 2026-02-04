'use client';

import { useState } from 'react';
import './about.css';

/**
 * WHAT IS SOCIAL EXCHANGE
 * Comprehensive guide with FAQ, How-To, and Resources
 */

type TabType = 'overview' | 'faq' | 'how-to' | 'resources' | 'legal';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="about-root">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">Social Exchange</h1>
          <p className="hero-tagline">
            The platform where creators and communities grow together
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-value">150+</span>
              <span className="stat-label">Communities</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">12K+</span>
              <span className="stat-label">Supporters</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">$48K+</span>
              <span className="stat-label">Creator Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="about-nav">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'faq', label: 'FAQ' },
          { key: 'how-to', label: 'How It Works' },
          { key: 'resources', label: 'Resources' },
          { key: 'legal', label: 'Legal & Terms' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="about-content">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'faq' && <FAQSection expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} />}
        {activeTab === 'how-to' && <HowToSection />}
        {activeTab === 'resources' && <ResourcesSection />}
        {activeTab === 'legal' && <LegalSection />}
      </div>
    </div>
  );
}

/* =========================================
   OVERVIEW SECTION
========================================= */
function OverviewSection() {
  return (
    <div className="section-content">
      <h2>What is Social Exchange?</h2>

      <div className="intro-text">
        <p>
          Social Exchange is a <strong>community support platform</strong> that connects
          creators with their most dedicated fans. Unlike traditional social media,
          we give communities the tools to directly support the creators they believe in.
        </p>
        <p>
          Through our <strong>Community Credits</strong> system, supporters can show their
          commitment to creators they love, unlock exclusive benefits, and become part
          of a creator's inner circle.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">🌟</div>
          <h3>For Supporters</h3>
          <ul>
            <li>Support creators you believe in</li>
            <li>Unlock exclusive content & perks</li>
            <li>Join tight-knit communities</li>
            <li>Get recognized for your support</li>
            <li>Direct access to creators</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>For Creators</h3>
          <ul>
            <li>Build a dedicated community</li>
            <li>Sustainable income from supporters</li>
            <li>Identify your biggest fans</li>
            <li>Offer exclusive benefits</li>
            <li>Grow with your community</li>
          </ul>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🤝</div>
          <h3>Community First</h3>
          <ul>
            <li>Direct creator-fan relationships</li>
            <li>No algorithms deciding visibility</li>
            <li>Transparent support tracking</li>
            <li>Meaningful engagement</li>
            <li>Shared growth and success</li>
          </ul>
        </div>
      </div>

      <div className="highlight-box">
        <h3>Important: This is NOT an Investment Platform</h3>
        <p>
          Social Exchange is designed for <strong>community support</strong>, not financial investment.
          Community Credits provide access to benefits and recognition—they are not securities,
          and there is no expectation of profit. When you support a creator, you're joining
          their community, not making a financial investment.
        </p>
      </div>
    </div>
  );
}

/* =========================================
   FAQ SECTION
========================================= */
const FAQ_DATA = [
  {
    category: 'General',
    questions: [
      {
        id: 'what-is-se',
        q: 'What is Social Exchange?',
        a: 'Social Exchange is a community support platform where fans can directly support creators they believe in. Through Community Credits, supporters gain access to exclusive benefits, recognition, and closer relationships with creators.'
      },
      {
        id: 'how-different',
        q: 'How is this different from Patreon or Ko-fi?',
        a: 'While similar in spirit, Social Exchange offers a unique credit-based system with tiered benefits. Supporters accumulate credits that unlock progressively better perks. It\'s designed for deeper community engagement rather than simple subscriptions.'
      },
      {
        id: 'is-investment',
        q: 'Is this an investment platform?',
        a: 'No. Social Exchange is strictly a community support platform. Community Credits are for accessing benefits and showing support—they are not investments, securities, or financial instruments. There is no expectation of profit or financial return.'
      },
    ]
  },
  {
    category: 'For Supporters',
    questions: [
      {
        id: 'how-support',
        q: 'How do I support a creator?',
        a: 'Browse our communities, find a creator you want to support, and purchase Community Credits. Your credits unlock benefits based on your support tier. The more credits you hold, the higher your tier and the more exclusive your benefits.'
      },
      {
        id: 'what-benefits',
        q: 'What benefits do I get?',
        a: 'Benefits vary by tier and creator. Common perks include: supporter badges, early content access, exclusive community channels, direct messaging with creators, voting rights on decisions, merchandise discounts, and even 1-on-1 calls with top supporters.'
      },
      {
        id: 'credits-expire',
        q: 'Do my credits expire?',
        a: 'No, credits do not expire as long as the community remains active. Your tier status is maintained based on the credits you hold.'
      },
      {
        id: 'transfer-credits',
        q: 'Can I transfer my credits to someone else?',
        a: 'Yes, you can gift or transfer credits to other users. This is meant for sharing support with friends, not for trading or selling.'
      },
      {
        id: 'get-refund',
        q: 'Can I get a refund?',
        a: 'Credits are generally non-refundable as they represent support for creators. However, if a creator abandons their community before their commitment period ends, eligible supporters may receive a refund.'
      },
    ]
  },
  {
    category: 'For Creators',
    questions: [
      {
        id: 'start-community',
        q: 'How do I start a community?',
        a: 'Click "Create Your Community" in the E-Shares section. You\'ll need a minimum $100 setup deposit to demonstrate your commitment. This creates credits that supporters can purchase to join your community.'
      },
      {
        id: 'setup-deposit',
        q: 'What is the setup deposit?',
        a: 'The setup deposit (minimum $100) shows your commitment to your community. It\'s used to create the initial credit pool. The amount determines how many credits are available for supporters to purchase.'
      },
      {
        id: 'commitment-period',
        q: 'What is the commitment period?',
        a: 'Creators commit to maintaining their community for at least 1 year. This protects supporters by ensuring creators don\'t immediately abandon their community after receiving support.'
      },
      {
        id: 'what-benefits-offer',
        q: 'What benefits should I offer?',
        a: 'We recommend tiered benefits: basic (badges, announcements), mid-tier (early access, exclusive content), high-tier (direct access, voting rights), and top-tier (1-on-1 engagement, co-creation). Focus on what you can consistently deliver.'
      },
      {
        id: 'how-paid',
        q: 'How do I get paid?',
        a: 'When supporters purchase credits, the funds (minus platform fee) go directly to you. Payouts are processed weekly to your connected payment method.'
      },
    ]
  },
  {
    category: 'Platform & Fees',
    questions: [
      {
        id: 'platform-fee',
        q: 'What fees does Social Exchange charge?',
        a: 'We charge a 5% platform fee on credit purchases. This covers payment processing, platform maintenance, and support. There are no fees on credit transfers between users.'
      },
      {
        id: 'credits-rate',
        q: 'What is the credit exchange rate?',
        a: 'Credits are sold at a fixed rate of 100 credits per $1. This rate does not fluctuate—it\'s designed for predictable community support, not speculation.'
      },
      {
        id: 'payment-methods',
        q: 'What payment methods are accepted?',
        a: 'We accept major credit cards, debit cards, and select digital payment methods. Cryptocurrency support is planned for the future.'
      },
    ]
  },
];

function FAQSection({
  expandedFaq,
  setExpandedFaq
}: {
  expandedFaq: string | null;
  setExpandedFaq: (id: string | null) => void;
}) {
  return (
    <div className="section-content">
      <h2>Frequently Asked Questions</h2>

      <div className="faq-container">
        {FAQ_DATA.map(category => (
          <div key={category.category} className="faq-category">
            <h3>{category.category}</h3>
            <div className="faq-list">
              {category.questions.map(item => (
                <div
                  key={item.id}
                  className={`faq-item ${expandedFaq === item.id ? 'expanded' : ''}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-toggle">{expandedFaq === item.id ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === item.id && (
                    <div className="faq-answer">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================
   HOW TO SECTION
========================================= */
function HowToSection() {
  return (
    <div className="section-content">
      <h2>How It Works</h2>

      {/* For Supporters */}
      <div className="how-to-section">
        <h3>🎯 For Supporters</h3>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Browse Communities</h4>
              <p>
                Explore creators on Social Exchange. Check out their content, community size,
                and the benefits they offer at each support tier.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Purchase Credits</h4>
              <p>
                Choose how much you want to support. Credits are $1 = 100 credits.
                Your credits unlock benefits based on your tier level.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Unlock Benefits</h4>
              <p>
                Your credits automatically place you in a tier. As you accumulate more credits,
                you unlock higher tiers with better perks.
              </p>
              <div className="tier-preview">
                <div className="tier-item">
                  <span className="tier-icon">🌱</span>
                  <span>100+ = Backer</span>
                </div>
                <div className="tier-item">
                  <span className="tier-icon">⭐</span>
                  <span>500+ = Supporter</span>
                </div>
                <div className="tier-item">
                  <span className="tier-icon">🏆</span>
                  <span>1000+ = Champion</span>
                </div>
                <div className="tier-item">
                  <span className="tier-icon">👑</span>
                  <span>5000+ = Founding</span>
                </div>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Engage & Enjoy</h4>
              <p>
                Access your exclusive benefits, engage with the community, and enjoy
                your closer relationship with the creator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Creators */}
      <div className="how-to-section">
        <h3>🎨 For Creators</h3>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Create Your Community</h4>
              <p>
                Set up your community profile with your brand name, description, and social links.
                Make a minimum $100 setup deposit to show commitment.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Sign Community Agreement</h4>
              <p>
                Acknowledge that this is a community support platform, not an investment vehicle.
                Commit to maintaining your community for at least 1 year.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Define Your Benefits</h4>
              <p>
                Set up what supporters get at each tier. Be realistic about what you can
                consistently deliver. Quality matters more than quantity.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Go Live & Grow</h4>
              <p>
                Launch your community, promote it to your existing audience, and start
                welcoming supporters. Engage actively to build a thriving community.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Deliver & Maintain</h4>
              <p>
                Consistently deliver on your promised benefits. Engage with supporters,
                create exclusive content, and nurture your community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   RESOURCES SECTION
========================================= */
function ResourcesSection() {
  return (
    <div className="section-content">
      <h2>Resources</h2>

      <div className="resources-grid">
        <div className="resource-category">
          <h3>📚 Guides</h3>
          <div className="resource-list">
            <a href="#" className="resource-link">
              <span className="resource-title">Getting Started as a Supporter</span>
              <span className="resource-desc">Complete guide to supporting creators</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Creator Onboarding Guide</span>
              <span className="resource-desc">Step-by-step community setup</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Tier Benefits Best Practices</span>
              <span className="resource-desc">How to structure compelling benefits</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Community Engagement Playbook</span>
              <span className="resource-desc">Keep your community active and engaged</span>
            </a>
          </div>
        </div>

        <div className="resource-category">
          <h3>📹 Video Tutorials</h3>
          <div className="resource-list">
            <a href="#" className="resource-link">
              <span className="resource-title">Platform Tour (5 min)</span>
              <span className="resource-desc">Quick overview of Social Exchange</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Buying Your First Credits</span>
              <span className="resource-desc">Step-by-step walkthrough</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Setting Up Your Community</span>
              <span className="resource-desc">Complete creator setup tutorial</span>
            </a>
          </div>
        </div>

        <div className="resource-category">
          <h3>💬 Support</h3>
          <div className="resource-list">
            <a href="#" className="resource-link">
              <span className="resource-title">Help Center</span>
              <span className="resource-desc">Search our knowledge base</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Contact Support</span>
              <span className="resource-desc">Get help from our team</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Community Discord</span>
              <span className="resource-desc">Chat with other users</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Report an Issue</span>
              <span className="resource-desc">Report bugs or problems</span>
            </a>
          </div>
        </div>

        <div className="resource-category">
          <h3>📊 Tools</h3>
          <div className="resource-list">
            <a href="#" className="resource-link">
              <span className="resource-title">Credit Calculator</span>
              <span className="resource-desc">Plan your support amount</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Tier Comparison Tool</span>
              <span className="resource-desc">Compare benefits across tiers</span>
            </a>
            <a href="#" className="resource-link">
              <span className="resource-title">Creator Analytics</span>
              <span className="resource-desc">Track your community growth</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   LEGAL SECTION
========================================= */
function LegalSection() {
  return (
    <div className="section-content">
      <h2>Legal & Terms</h2>

      <div className="legal-notice">
        <h3>⚠️ Important Legal Notice</h3>
        <p>
          <strong>Community Credits are NOT securities, investments, or financial instruments.</strong>
        </p>
        <p>
          Social Exchange is a community support platform. Credits provide access to benefits
          and recognition. There is no expectation of profit, financial return, or price appreciation.
          Do not purchase credits with the expectation of making money.
        </p>
      </div>

      <div className="legal-docs">
        <div className="legal-doc">
          <h4>Terms of Service</h4>
          <p>
            By using Social Exchange, you agree to our terms governing platform use,
            community conduct, and credit transactions.
          </p>
          <a href="#" className="legal-link">Read Full Terms →</a>
        </div>

        <div className="legal-doc">
          <h4>Privacy Policy</h4>
          <p>
            Learn how we collect, use, and protect your personal information on our platform.
          </p>
          <a href="#" className="legal-link">Read Privacy Policy →</a>
        </div>

        <div className="legal-doc">
          <h4>Community Agreement (Supporters)</h4>
          <p>
            The agreement supporters acknowledge when purchasing credits, including the
            understanding that credits are for community support, not investment.
          </p>
          <a href="#" className="legal-link">Read Agreement →</a>
        </div>

        <div className="legal-doc">
          <h4>Creator Agreement</h4>
          <p>
            The agreement creators sign when establishing a community, including commitment
            period obligations and benefit delivery requirements.
          </p>
          <a href="#" className="legal-link">Read Agreement →</a>
        </div>

        <div className="legal-doc">
          <h4>Refund Policy</h4>
          <p>
            Information about our refund policies, including circumstances where refunds
            may be issued for abandoned communities.
          </p>
          <a href="#" className="legal-link">Read Refund Policy →</a>
        </div>

        <div className="legal-doc">
          <h4>Copyright & DMCA</h4>
          <p>
            Our policies regarding intellectual property, copyright claims, and DMCA
            takedown procedures.
          </p>
          <a href="#" className="legal-link">Read Copyright Policy →</a>
        </div>
      </div>

      <div className="disclaimer-box">
        <h4>Full Disclaimer</h4>
        <p>
          Social Exchange ("Platform") provides a community support service connecting creators
          with their supporters. Community Credits ("Credits") are utility tokens that provide
          access to benefits, recognition, and community features. Credits are not:
        </p>
        <ul>
          <li>Securities or investment contracts</li>
          <li>Cryptocurrency or digital assets intended for trading</li>
          <li>Financial instruments with expected profit</li>
          <li>Equity or ownership in any entity</li>
        </ul>
        <p>
          By using this Platform, you acknowledge that you are supporting creators for the
          purpose of community engagement and access to benefits, not for financial gain.
          The Platform makes no guarantees about the future value, utility, or availability
          of Credits.
        </p>
        <p>
          For questions, contact: legal@socialexchange.io
        </p>
      </div>
    </div>
  );
}

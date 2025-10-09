import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navigation simplified={true} />
      <div className="app-content">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content animate-in">
              <h1>Unlock Performance, one strength at a time</h1>
              <p className="hero-subtitle">
                From the cradle to the cubicle, we devote more time to our shortcomings than to our strengths, it's time to flip the script!
              </p>
              <p>
                <span className="yellow-highlight">Strengths Manager</span> will transform your strengths data into actionable coaching.
              </p>
              <div className="hero-buttons">
                <Link href="/signup">
                  <button className="primary-button">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
            <div className="hero-visual animate-in" style={{ animationDelay: '0.2s' }}>
              <Image
                src="/image_1751180885555.png"
                alt="Colorful fingerprint"
                width={400}
                height={400}
                priority
                className="fingerprint-image"
                style={{
                  borderRadius: '10px',
                  background: 'transparent',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                }}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features" id="features">
          <div className="features-container">
            <div className="features-grid">
              <div className="feature-card animate-in">
                <div className="feature-number">01</div>
                <h4>2-Minute Setup</h4>
                <p>Import your CliftonStrengths or select manually. Add your team members' top 5 strengths. You're ready to lead differently.</p>
              </div>
              <div className="feature-card animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="feature-number">02</div>
                <h4>Smart Conversations</h4>
                <p>Our AI coach remembers your context, suggests relevant questions, and builds on previous conversations to deepen your practice.</p>
              </div>
              <div className="feature-card animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="feature-number">03</div>
                <h4>Team Dashboard</h4>
                <p>Visualize your team's collective strengths, see domain balance, and identify opportunities for powerful collaborations.</p>
              </div>
              <div className="feature-card animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="feature-number">04</div>
                <h4>Partnership Magic</h4>
                <p>Select any two team members and get specific, actionable advice on how to make their partnership exceptional.</p>
              </div>
              <div className="feature-card animate-in" style={{ animationDelay: '0.4s' }}>
                <div className="feature-number">05</div>
                <h4>Weekly Nudges</h4>
                <p>Personalized tips every Monday morning that help you apply your strengths and engage your team's unique talents throughout the week.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <footer>
        <div className="footer-content">
          <p>Don't waste time trying to put in what was left out. Try to draw out what was left in.</p>
          <Link href="/signup">
            <button className="footer-button">
              Get Started
            </button>
          </Link>
        </div>
      </footer>
    </>
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tanvelo — Universal LLM Federation Gateway';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090D16',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              T
            </div>
            <span style={{ fontSize: '30px', fontWeight: 'bold', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              tanvelo
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#38BDF8',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            Universal LLM Gateway
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              maxWidth: '980px',
            }}
          >
            One gateway. Every model. Zero downtime.
          </div>

          <div
            style={{
              fontSize: '22px',
              color: '#94A3B8',
              lineHeight: 1.45,
              maxWidth: '880px',
            }}
          >
            Automated sub-180ms failover, deterministic routing, atomic Redis rate limits, and zero prompt retention.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {['Sub-180ms Failover', 'Redis Rate Limits', 'Zero Prompt Retention', 'Official SDKs'].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                  color: '#E2E8F0',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

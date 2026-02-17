export default function RestrictedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #02040a 0%, #0a1118 50%, #020409 100%)',
        color: '#e6e6e6',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(63, 255, 220, 0.15) 0%, transparent 70%)',
          border: '1px solid rgba(63, 255, 220, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          fontSize: '3rem',
        }}
      >
        🌐
      </div>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3fffdc, #00d4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        REGION RESTRICTED
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}
      >
        Social Exchange is not currently available in your region.
        We are working to expand our service to more territories.
      </p>

      <div
        style={{
          padding: '1.25rem 2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: '400px',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Why am I seeing this?</strong>
        <br />
        Due to regulatory requirements, Social Exchange is available to users
        outside of the United States. We appreciate your interest and will
        notify you when service becomes available in your area.
      </div>

      <p
        style={{
          marginTop: '3rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.2em',
        }}
      >
        SOCIAL &bull; EXCHANGE
      </p>
    </div>
  );
}

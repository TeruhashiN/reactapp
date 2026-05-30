export default function Dictionary() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f4f0",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #D3D1C7",
            borderRadius: 12,
            padding: "1.25rem",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Dictionary
          </h1>
          <p style={{ color: "#888780", marginTop: 8 }}>
            This page will be connected to the database later.
          </p>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: "#2C2C2A" }}>
              Placeholder content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

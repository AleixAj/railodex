"use client";

// Last line of defence: shown when even the root layout fails (or the login page, which sits
// outside the app shell). It replaces the whole document, so it can't use the app's styles.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#12110f",
          color: "#f2ede6",
          fontFamily: "system-ui, sans-serif",
          padding: 16,
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 26, margin: "0 0 8px" }}>Algo ha fallado</h1>
          <p style={{ color: "#bdb5aa", margin: "0 0 20px" }}>
            No se ha podido cargar Railodex. Suele ser un problema de conexión pasajero.
          </p>
          <button
            onClick={() => retry()}
            style={{
              height: 44,
              padding: "0 20px",
              border: 0,
              borderRadius: 10,
              background: "#e8892c",
              color: "#1a1714",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}

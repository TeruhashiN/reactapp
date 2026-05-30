import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

type MeResponse = {
  user: { user_id: number; username: string; score: number };
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Missing token");
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed: ${res.status}`);
        }

        const data: MeResponse = await res.json();
        setMe(data.user);
      } catch (e: any) {
        setError(e?.message || "Failed to load user");
        setMe(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (!loading && !me) {
    // Redirect unauthorized users back to quiz login
    return <Navigate to="/quiz" replace />;
  }

  if (loading) {
    return (
      <section style={{ padding: 24 }}>
        <h2>Loading dashboard...</h2>
      </section>
    );
  }

  return (
    <section style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Dashboard</h1>
      <p style={{ margin: 0 }}>
        Logged in as: <strong>{me?.username}</strong>
      </p>
      <p style={{ margin: "8px 0 0" }}>
        Current score: <strong>{me?.score}</strong>
      </p>

      {error && (
        <p style={{ marginTop: 16, color: "#b91c1c" }}>Error: {error}</p>
      )}
    </section>
  );
}

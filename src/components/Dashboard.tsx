import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

type MeResponse = {
  user: { user_id: number; username: string; score: number };
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function levelFromScore(score: number) {
  if (!Number.isFinite(score) || score < 0) return 1;
  // L1: 0-49, L2: 50-99, ... L10: 450+
  return Math.min(10, Math.floor(score / 50) + 1);
}

function progressToNextLevel(score: number) {
  const level = levelFromScore(score);

  const currentRangeStart = (level - 1) * 50;
  const currentRangeEnd = level * 50;

  // Already at max level
  if (level >= 10) {
    return {
      level,
      progress: 1,
      currentRangeStart: 450,
      currentRangeEnd: 500,
    };
  }

  const progress =
    (score - currentRangeStart) / (currentRangeEnd - currentRangeStart);

  return {
    level,
    progress: clamp(progress, 0, 1),
    currentRangeStart,
    currentRangeEnd,
  };
}

function getInitials(username: string) {
  return username
    .split(/[\s_-]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [leaderboard, setLeaderboard] = useState<{
    totalUsers: number;
    rank: number;
  } | null>(null);
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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed: ${res.status}`);
        }
        const data: MeResponse = await res.json();
        setMe(data.user);

        // fetch leaderboard rank for the logged-in user
        const lbRes = await fetch("http://localhost:4000/api/leaderboard/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!lbRes.ok) {
          const msg = await lbRes.text();
          throw new Error(msg || `Request failed: ${lbRes.status}`);
        }
        const lbData: { totalUsers: number; rank: number } = await lbRes.json();
        setLeaderboard(lbData);
      } catch (e: any) {
        setError(e?.message || "Failed to load user");
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const derived = useMemo(() => {
    const score = me?.score ?? 0;
    const { level, progress, currentRangeStart, currentRangeEnd } =
      progressToNextLevel(score);
    const streak = clamp(Math.floor(score / 25), 0, 50);
    return {
      level,
      score,
      progress,
      streak,
      highScore: score,
      currentRangeStart,
      currentRangeEnd,
    };
  }, [me]);

  if (!loading && !me) return <Navigate to="/quiz" replace />;

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading dashboard…</p>
      </div>
    );
  }

  const initials = me ? getInitials(me.username) : "?";
  const progressPct = Math.round(derived.progress * 100);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ── Hero ── */}
        <div style={styles.hero}>
          <div style={styles.avatar}>{initials}</div>
          <div style={styles.heroInfo}>
            <h1 style={styles.heroName}>{me?.username}</h1>
            <p style={styles.heroSub}>User ID #{me?.user_id}</p>
          </div>
          <span style={styles.badgeTeal}>⭐ Top player</span>
        </div>

        {/* ── Stat cards ── */}
        <div style={styles.statGrid}>
          {[
            {
              label: "LEVEL",
              value: `L${derived.level}`,
              sub: "of 10 total",
              color: "#3C3489",
              bg: "#EEEDFE",
              icon: "🏆",
            },
            {
              label: "SCORE",
              value: derived.score,
              sub: "personal best",
              color: "#085041",
              bg: "#E1F5EE",
              icon: "📊",
            },
            {
              label: "STREAK",
              value: derived.streak,
              sub: "days active",
              color: "#712B13",
              bg: "#FAECE7",
              icon: "🔥",
            },
            {
              label: "RANK",
              value: leaderboard ? `#${leaderboard.rank}` : "#…",
              sub: leaderboard
                ? `of ${leaderboard.totalUsers} users`
                : "global standing",
              color: "#0C447C",
              bg: "#E6F1FB",
              icon: "🥇",
            },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={{ ...styles.statValue, color: s.color }}>
                {s.value}
              </div>
              <div style={styles.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Level picker ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Choose a level</h2>
              <p style={styles.cardSub}>
                Unlock higher levels by scoring more points
              </p>
            </div>
            <span style={styles.badgePurple}>
              Unlocked up to L{derived.level}
            </span>
          </div>
          <div style={styles.levelGrid}>
            {Array.from({ length: 10 }).map((_, idx) => {
              const lvl = idx + 1;
              const unlocked = lvl <= derived.level;
              const isCurrent = lvl === derived.level;
              return (
                <button
                  key={lvl}
                  disabled={!unlocked}
                  onClick={() =>
                    alert(`Level ${lvl} quizzes will be added later.`)
                  }
                  style={{
                    ...styles.lvlBtn,
                    ...(isCurrent
                      ? styles.lvlBtnCurrent
                      : unlocked
                        ? styles.lvlBtnUnlocked
                        : styles.lvlBtnLocked),
                  }}
                >
                  {isCurrent ? "👑 " : ""}L{lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dictionary ── */}
        <div style={styles.card}>
          <button
            type="button"
            onClick={() => navigate("/dictionary")}
            style={{
              width: "100%",
              border: "0.5px solid #D3D1C7",
              background: "#FAECE7",
              padding: "0.95rem 1rem",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              transition:
                "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
            }}
            aria-label="Open dictionary"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 18px rgba(60, 52, 137, 0.10)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "#F7E0D8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "#FAECE7";
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 16 }}>
                Dictionary
              </h2>
              <p style={{ ...styles.cardSub, margin: 0 }}>
                Quick lookup for useful words
              </p>
            </div>
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#EEEDFE",
                border: "0.5px solid #AFA9EC",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
                color: "#3C3489",
              }}
            >
              🔎
            </span>
          </button>
        </div>

        {/* ── English level ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>English level</h2>
          <p style={styles.cardSub}>Pick a difficulty to practise</p>
          <div style={styles.sectionGrid}>
            {[
              { label: "🌱 Beginner", cls: "teal" },
              { label: "🌿 Intermediate", cls: "purple" },
              { label: "🚀 Advanced", cls: "coral", full: true },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => alert(`${b.label} English section coming soon!`)}
                style={{
                  ...styles.secBtn,
                  ...(b.cls === "teal"
                    ? styles.secBtnTeal
                    : b.cls === "purple"
                      ? styles.secBtnPurple
                      : styles.secBtnCoral),
                  ...(b.full ? { gridColumn: "1 / -1" } : {}),
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Reading section ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Reading section</h2>
          <p style={styles.cardSub}>
            Choose an exercise to improve comprehension
          </p>
          <div style={styles.sectionGrid}>
            {[
              { label: "📄 Short passages", cls: "teal" },
              { label: "📚 Long articles", cls: "purple" },
              { label: "✏️ Comprehension quiz", cls: "coral", full: true },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => alert(`${b.label} reading section coming soon!`)}
                style={{
                  ...styles.secBtn,
                  ...(b.cls === "teal"
                    ? styles.secBtnTeal
                    : b.cls === "purple"
                      ? styles.secBtnPurple
                      : styles.secBtnCoral),
                  ...(b.full ? { gridColumn: "1 / -1" } : {}),
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Progress + Details ── */}
        <div style={styles.bottomGrid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Progress to next level</h2>
            <p style={styles.cardSub}>
              L{derived.level} → L{Math.min(derived.level + 1, 10)}
            </p>
            <div style={styles.progressWrap}>
              <div
                style={{ ...styles.progressBar, width: `${progressPct}%` }}
              />
            </div>
            <div style={styles.progLabels}>
              <span>
                {derived.level === 1 ? 0 : derived.currentRangeStart} pts
              </span>
              <span style={{ fontWeight: 500 }}>{progressPct}%</span>
              <span>{derived.currentRangeEnd} pts</span>
            </div>
            <p style={{ ...styles.cardSub, marginTop: 12 }}>
              {derived.level < 10
                ? `Score ${derived.currentRangeEnd - derived.score} more pts to reach Level 10!`
                : "Keep scoring to reach Level 10!"}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Details</h2>
            {[
              { label: "User ID", value: `#${me?.user_id}` },
              { label: "Level", value: `L${derived.level}` },
              { label: "Score", value: derived.score },
              { label: "Streak", value: `${derived.streak} days` },
              {
                label: "Rank",
                value: leaderboard
                  ? `#${leaderboard.rank} / ${leaderboard.totalUsers}`
                  : "#…",
              },
            ].map((row) => (
              <div key={row.label} style={styles.dlRow}>
                <span style={styles.dlLabel}>{row.label}</span>
                <span style={styles.dlVal}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Options ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Options</h2>
          <div style={styles.optRow}>
            {["⚙️ Settings", "🔒 Change password"].map((opt) => (
              <button
                key={opt}
                onClick={() => alert(`${opt} feature coming soon!`)}
                style={styles.optBtn}
              >
                {opt}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/quiz";
              }}
              style={{ ...styles.optBtn, ...styles.optBtnDanger }}
            >
              🚪 Log out
            </button>
          </div>
        </div>

        {error && <p style={styles.errorText}>Error: {error}</p>}
      </div>
    </div>
  );
}

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f4f0",
    padding: "24px 16px 48px",
  },
  container: {
    maxWidth: 680,
    margin: "0 auto",
  },

  /* Loading */
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 16,
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    border: "3px solid #D3D1C7",
    borderTop: "3px solid #3C3489",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#888780",
    fontSize: 14,
  },

  /* Hero */
  hero: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#EEEDFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 500,
    color: "#3C3489",
    flexShrink: 0,
    letterSpacing: 1,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: 500, margin: 0 },
  heroSub: { fontSize: 13, color: "#888780", margin: "2px 0 0" },
  badgeTeal: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#E1F5EE",
    color: "#0F6E56",
    whiteSpace: "nowrap",
  },
  badgePurple: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#EEEDFE",
    color: "#3C3489",
    whiteSpace: "nowrap",
  },

  /* Stat grid */
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 10,
    marginBottom: "1rem",
  },
  statCard: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 10,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  statLabel: {
    fontSize: 11,
    color: "#888780",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 500,
    lineHeight: 1.1,
  },
  statSub: {
    fontSize: 12,
    color: "#B4B2A9",
    marginTop: 2,
  },

  /* Card */
  card: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: "1rem",
    flexWrap: "wrap" as const,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    margin: "0 0 3px",
  },
  cardSub: {
    fontSize: 13,
    color: "#888780",
    margin: 0,
  },

  /* Level grid */
  levelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 12,
  },
  lvlBtn: {
    borderRadius: 8,
    padding: "0.55rem 0.35rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "0.5px solid",
    transition: "background 0.15s, transform 0.1s",
    lineHeight: 1,
  },
  lvlBtnCurrent: {
    background: "#EEEDFE",
    color: "#3C3489",
    borderColor: "#AFA9EC",
  },
  lvlBtnUnlocked: {
    background: "#fff",
    color: "#444441",
    borderColor: "#B4B2A9",
  },
  lvlBtnLocked: {
    background: "#F1EFE8",
    color: "#B4B2A9",
    borderColor: "#D3D1C7",
    cursor: "default",
    opacity: 0.5,
  },

  /* Section buttons */
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 12,
  },
  secBtn: {
    border: "0.5px solid",
    borderRadius: 8,
    padding: "0.65rem 1rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.15s, transform 0.1s",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  secBtnTeal: {
    background: "#E1F5EE",
    color: "#085041",
    borderColor: "#5DCAA5",
  },
  secBtnPurple: {
    background: "#EEEDFE",
    color: "#3C3489",
    borderColor: "#AFA9EC",
  },
  secBtnCoral: {
    background: "#FAECE7",
    color: "#993C1D",
    borderColor: "#F0997B",
  },

  /* Bottom grid */
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: "1rem",
  },

  /* Progress */
  progressWrap: {
    height: 8,
    background: "#F1EFE8",
    borderRadius: 20,
    overflow: "hidden",
    margin: "12px 0 6px",
  },
  progressBar: {
    height: "100%",
    borderRadius: 20,
    background: "#1D9E75",
    transition: "width 0.4s ease",
  },
  progLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#888780",
  },

  /* Details list */
  dlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: "0.5px solid #F1EFE8",
    fontSize: 13,
  },
  dlLabel: { color: "#888780" },
  dlVal: { fontWeight: 500 },

  /* Dictionary table */
  tableWrap: {
    marginTop: 12,
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate" as const,
    borderSpacing: 0,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    fontSize: 12,
    color: "#888780",
    fontWeight: 600,
    padding: "10px 10px",
    borderBottom: "0.5px solid #F1EFE8",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 10px",
    borderBottom: "0.5px solid #F1EFE8",
    color: "#2C2C2A",
    verticalAlign: "top",
  },
  tdWord: {
    padding: "10px 10px",
    borderBottom: "0.5px solid #F1EFE8",
    fontWeight: 600,
    color: "#3C3489",
    whiteSpace: "nowrap",
    verticalAlign: "top",
  },

  /* Options */
  optRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    marginTop: 12,
  },
  optBtn: {
    border: "0.5px solid #D3D1C7",
    background: "#fff",
    color: "#2C2C2A",
    borderRadius: 8,
    padding: "0.65rem 1rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    textAlign: "left" as const,
    transition: "background 0.15s, transform 0.1s",
    width: "100%",
  },
  optBtnDanger: {
    color: "#A32D2D",
    borderColor: "#F09595",
    background: "#FCEBEB",
  },

  /* Error */
  errorText: { color: "#A32D2D", fontSize: 13, marginTop: 8 },
};

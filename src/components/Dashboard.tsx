import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";
import CreateAccountModal from "./CreateAccountModal";

type MeResponse = {
  user: { user_id: number; username: string; score: number; role: string };
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function levelFromScore(score: number) {
  if (!Number.isFinite(score) || score < 0) return 1;
  // L1: 0-24, L2: 25-49, ... L20: 475+
  return Math.min(20, Math.floor(score / 25) + 1);
}

function progressToNextLevel(score: number) {
  const level = levelFromScore(score);

  const currentRangeStart = (level - 1) * 25;
  const currentRangeEnd = level * 25;

  // Already at max level
  if (level >= 20) {
    return {
      level,
      progress: 1,
      currentRangeStart: 475,
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
  const [rankingUsers, setRankingUsers] = useState<
    { rank: number; username: string; score: number; user_id: number }[]
  >([]);
  const [showRanking, setShowRanking] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);

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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load user";
        setError(msg);
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const fetchRanking = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRankingLoading(true);
    try {
      const res = await fetch(
        "http://localhost:4000/api/leaderboard?limit=20",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: {
        users: {
          rank: number;
          username: string;
          score: number;
          user_id: number;
        }[];
      } = await res.json();
      setRankingUsers(data.users);
      setShowRanking(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ranking");
    } finally {
      setRankingLoading(false);
    }
  };

  const [englishCount, setEnglishCount] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/dictionary/english");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data: { items: unknown[] } = await res.json();
        setEnglishCount(Array.isArray(data.items) ? data.items.length : 0);
      } catch {
        setEnglishCount(0);
      }
    };
    run();
  }, []);

  const derived = useMemo(() => {
    const score = me?.score ?? 0;
    const { level, progress, currentRangeStart, currentRangeEnd } =
      progressToNextLevel(score);

    return {
      level,
      score,
      progress,
      englishCount,
      highScore: score,
      currentRangeStart,
      currentRangeEnd,
    };
  }, [me, englishCount]);

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
          {leaderboard?.rank === 1 && (
            <span style={styles.badgeTeal}>⭐ Top player</span>
          )}
          {leaderboard?.rank === 2 && (
            <span style={styles.badgeSilver}>🥈 Runner-up</span>
          )}
          {leaderboard?.rank === 3 && (
            <span style={styles.badgeBronze}>🥉 Third place</span>
          )}
          {leaderboard && leaderboard.rank > 3 && leaderboard.rank <= 5 && (
            <span style={styles.badgeCoral}>🔥 Rising star</span>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div style={styles.statGrid}>
          {[
            {
              label: "LEVEL",
              value: `L${derived.level}`,
              sub: "of 20 total",
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
              label: "ENGLISH",
              value: derived.englishCount,
              sub: "total English words",
              color: "#712B13",
              bg: "#FAECE7",
              icon: "📚",
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
                Unlock higher levels by scoring 25 points for each level
              </p>
            </div>
            <span style={styles.badgePurple}>
              Unlocked up to L{derived.level}
            </span>
          </div>
          <div style={styles.levelGrid}>
            {Array.from({ length: derived.level }).map((_, idx) => {
              const lvl = idx + 1;
              const isCurrent = lvl === derived.level;
              return (
                <button
                  key={lvl}
                  onClick={() => navigate(`/quiz-mode?level=${lvl}`)}
                  style={{
                    ...styles.lvlBtn,
                    ...(isCurrent
                      ? styles.lvlBtnCurrent
                      : styles.lvlBtnUnlocked),
                  }}
                >
                  {isCurrent ? "👑 " : ""}L{lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Timer Quiz ── */}
        <div style={styles.card}>
          <button
            type="button"
            onClick={() => navigate("/timer-quiz?level=1")}
            style={{
              width: "100%",
              border: "0.5px solid #D3D1C7",
              background: "#E1F5EE",
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
            aria-label="Start timer quiz"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 18px rgba(13, 110, 86, 0.12)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(-1px)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "#C8E8DC";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "#E1F5EE";
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 style={{ ...styles.cardTitle, margin: 0, fontSize: 16 }}>
                ⏱️ Timer Quiz
              </h2>
              <p style={{ ...styles.cardSub, margin: 0 }}>
                Answer as many questions as you can before time runs out
              </p>
            </div>
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#fff",
                border: "0.5px solid #5DCAA5",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
                color: "#085041",
              }}
            >
              ⏰
            </span>
          </button>
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

        {/* ── Multiplayer Quiz Battle ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>⚔️ Multiplayer Quiz Battle</h2>
              <p style={styles.cardSub}>
                Challenge a player from the leaderboard. Choose an active
                opponent and answer 5, 10, or 20 questions.
              </p>
            </div>
            <span style={styles.badgePurple}>vs Player</span>
          </div>
          <div style={styles.sectionGrid}>
            <button
              type="button"
              onClick={() => navigate("/multiplayer-quiz")}
              style={{
                ...styles.secBtn,
                ...styles.secBtnTeal,
                width: "100%",
                cursor: "pointer",
                transition:
                  "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 18px rgba(13, 110, 86, 0.12)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#C8E8DC";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#E1F5EE";
              }}
            >
              <span>⚔️</span>
              <div>
                <div style={{ fontWeight: 500 }}>Start Battle</div>
                <div style={{ fontSize: 12, color: "#085041", opacity: 0.8 }}>
                  Challenge another player online
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate("/local-multiplayer")}
              style={{
                ...styles.secBtn,
                ...styles.secBtnPurple,
                width: "100%",
                cursor: "pointer",
                transition:
                  "transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 18px rgba(60, 52, 137, 0.12)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#E6E0FA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#EEEDFE";
              }}
            >
              <span>👥</span>
              <div>
                <div style={{ fontWeight: 500 }}>Local Multiplayer</div>
                <div style={{ fontSize: 12, color: "#3C3489", opacity: 0.8 }}>
                  2 - 4 players on same device
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ── Progress + Details ── */}
        <div style={styles.bottomGrid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Progress to next level</h2>
            <p style={styles.cardSub}>
              L{derived.level} → L{Math.min(derived.level + 1, 20)}
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
              {derived.level < 20
                ? `Score ${derived.currentRangeEnd - derived.score} more pts to reach Level 20!`
                : "Keep scoring to reach Level 20!"}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Details</h2>
            {[
              { label: "User ID", value: `#${me?.user_id}` },
              { label: "Level", value: `L${derived.level}` },
              { label: "Score", value: derived.score },
              { label: "English", value: `${derived.englishCount}` },
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

        {/* ── Ranking ── */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Ranking</h2>
              <p style={styles.cardSub}>Global leaderboard by total score</p>
            </div>
            <button
              type="button"
              onClick={fetchRanking}
              disabled={rankingLoading}
              style={{
                ...styles.rankBtn,
                opacity: rankingLoading ? 0.7 : 1,
              }}
            >
              {rankingLoading
                ? "Loading…"
                : showRanking
                  ? "Refresh"
                  : "View Ranking"}
            </button>
          </div>
          {showRanking && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>RANK</th>
                    <th style={styles.th}>USER</th>
                    <th style={styles.th}>SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingUsers.map((u) => {
                    const isMe = me?.user_id === u.user_id;
                    return (
                      <tr
                        key={u.user_id}
                        style={{
                          backgroundColor: isMe ? "#EEEDFE" : "transparent",
                        }}
                      >
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.rank === 1 && "🥇"}
                          {u.rank === 2 && "🥈"}
                          {u.rank === 3 && "🥉"}
                          {u.rank > 3 && `#${u.rank}`}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: isMe ? 600 : 400,
                            color: isMe ? "#3C3489" : "#2C2C2A",
                          }}
                        >
                          {u.username}
                          {isMe ? " (you)" : ""}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>
                          {u.score}
                        </td>
                      </tr>
                    );
                  })}
                  {rankingUsers.length === 0 && (
                    <tr>
                      <td style={styles.td} colSpan={3}>
                        No rankings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Options ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Options</h2>
          <div style={styles.optRow}>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              style={styles.optBtn}
            >
              ⚙️ Change Password
            </button>
            {me?.role === "admin" && (
              <button
                type="button"
                onClick={() => setCreateAccountOpen(true)}
                style={styles.optBtn}
              >
                👤 Create account
              </button>
            )}
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

        <p style={styles.betaText}>
          This is a beta version — some features may still be under development.
        </p>

        <CreateAccountModal
          open={createAccountOpen}
          onClose={() => setCreateAccountOpen(false)}
        />
        {error && <p style={styles.errorText}>Error: {error}</p>}
        <ChangePasswordModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => {
            setChangePasswordOpen(false);
            localStorage.removeItem("token");
            window.location.href = "/quiz";
          }}
        />
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
  badgeSilver: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#F0F1F2",
    color: "#555",
    border: "0.5px solid #CCC",
    whiteSpace: "nowrap",
  },
  badgeBronze: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#FAECE7",
    color: "#993C1D",
    border: "0.5px solid #F0997B",
    whiteSpace: "nowrap",
  },
  badgeCoral: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    background: "#FDE8EF",
    color: "#A32D6E",
    border: "0.5px solid #F4A0C4",
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
  rankBtn: {
    border: "0.5px solid #3C3489",
    borderRadius: 8,
    padding: "0.55rem 1rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    background: "#EEEDFE",
    color: "#3C3489",
    transition: "background 0.15s, transform 0.1s",
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
  betaText: {
    color: "#888780",
    fontSize: 13,
    fontStyle: "italic",
    margin: "12px 0 0",
  },
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Question = {
  id: number;
  question: string;
  choices: string[];
  answer: string;
};

const API = "http://localhost:4000/api";
const COUNT_OPTIONS = [5, 10, 20];

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, data: text };
  }
}

function shuffled<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MultiplayerQuizBattle() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<{ user_id: number; username: string; score: number }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [count, setCount] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch(`${API}/leaderboard?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await safeJson(res);
        if (!data.ok || !data.data?.users) throw new Error("Invalid players response");
        setPlayers(data.data.users);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load players");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [token]);

  const startBattle = async () => {
    if (!selectedPlayer) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/timer-quiz/questions?count=${count}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await safeJson(res);
      if (!data.ok || !data.data?.questions) throw new Error("Invalid questions response");

      const qs = data.data.questions.map((q: any, idx: number) => {
        const answers = shuffled([q.answer, q.distractor1, q.distractor2, q.distractor3]);
        return {
          id: idx,
          question: q.question,
          choices: answers,
          answer: q.answer,
        };
      });

      setQuestions(qs);
      setCurrent(0);
      setScore(0);
      setSelectedAnswer(null);
      setResult(null);
      setStarted(true);
      setFinished(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (choice: string) => {
    if (result !== null) return;
    setSelectedAnswer(choice);
    if (choice === questions[current].answer) {
      setScore((s) => s + 1);
      setResult("correct");
    } else {
      setResult("wrong");
    }
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      setStarted(false);
    } else {
      setCurrent((c) => c + 1);
      setSelectedAnswer(null);
      setResult(null);
    }
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelectedAnswer(null);
    setResult(null);
    setSelectedPlayer(null);
  };

  if (!started && !finished) {
    const player = players.find((p) => p.user_id === selectedPlayer);

    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                ...styles.backBtn,
                opacity: 0.8,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.8")}
            >
              ← Dashboard
            </button>
            <h2 style={{ ...styles.cardTitle, margin: "12px 0 4px" }}>⚔️ Mock Multiplayer Quiz Battle</h2>
            <p style={styles.cardSub}>
              Challenge another player from the leaderboard. Choose a player and number of questions to begin.
            </p>
            {error && <p style={styles.errorText}>Error: {error}</p>}
          </div>

          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>Choose Active Player</h3>
            <p style={{ ...styles.cardSub, marginBottom: 12 }}>
              Select a player from the leaderboard to challenge.
            </p>
            {fetching ? (
              <p style={styles.loadingText}>Loading players…</p>
            ) : players.length === 0 ? (
              <p style={styles.loadingText}>No players available.</p>
            ) : (
              <div style={styles.playerGrid}>
                {players.map((p) => {
                  const isSelected = selectedPlayer === p.user_id;
                  const initials = p.username
                    .split(/[\s_-]+/)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .slice(0, 2)
                    .join("");
                  return (
                    <button
                      key={p.user_id}
                      type="button"
                      onClick={() => setSelectedPlayer(p.user_id)}
                      style={{
                        ...styles.playerCard,
                        ...(isSelected ? styles.playerCardActive : styles.playerCardDefault),
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isSelected ? "#3C3489" : "#EEEDFE",
                          color: isSelected ? "#fff" : "#3C3489",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: 13,
                            color: isSelected ? "#3C3489" : "#2C2C2A",
                          }}
                        >
                          {p.username}
                          {player && p.user_id === player.user_id && " 👑"}
                        </div>
                        <div style={{ fontSize: 12, color: "#888780" }}>
                          Score: {p.score}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isSelected ? "#3C3489" : "#888780",
                          fontWeight: 500,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPlayer && (
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>Number of Questions</h3>
              <p style={{ ...styles.cardSub, marginBottom: 12 }}>
                How many questions would you like to answer?
              </p>
              <div style={styles.countGrid}>
                {COUNT_OPTIONS.map((n) => {
                  const isActive = count === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      style={{
                        ...styles.countBtn,
                        ...(isActive ? styles.countBtnActive : styles.countBtnDefault),
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={startBattle}
                disabled={loading || !selectedPlayer}
                style={{
                  ...styles.startBtn,
                  opacity: loading || !selectedPlayer ? 0.6 : 1,
                  cursor: loading || !selectedPlayer ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Loading questions…" : `Start ${count}-Question Battle`}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              ...styles.secondaryBtn,
              marginTop: 8,
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const title = pct >= 80 ? "🏆 Victory!" : pct >= 50 ? "⚔️ Close match!" : "💪 Keep training!";
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, fontSize: 18, marginBottom: 8 }}>{title}</h2>
            <p style={{ ...styles.cardSub, marginBottom: 20 }}>
              You scored {score} out of {total} ({pct}%)
            </p>
            <div style={styles.scoreBreakdown}>
              <div style={{ ...styles.scoreItem, background: "#E1F5EE", color: "#085041" }}>
                <div style={{ fontWeight: 600 }}>Correct</div>
                <div style={{ fontSize: 20 }}>{score}</div>
              </div>
              <div style={{ ...styles.scoreItem, background: "#FAECE7", color: "#993C1D" }}>
                <div style={{ fontWeight: 600 }}>Wrong</div>
                <div style={{ fontSize: 20 }}>{total - score}</div>
              </div>
              <div style={{ ...styles.scoreItem, background: "#EEEDFE", color: "#3C3489" }}>
                <div style={{ fontWeight: 600 }}>Total</div>
                <div style={{ fontSize: 20 }}>{total}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  ...styles.startBtn,
                  flex: 1,
                  opacity: 1,
                }}
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{
                  ...styles.secondaryBtn,
                  flex: 1,
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (started && questions.length > 0) {
    const q = questions[current];
    const answerColors: Record<string, React.CSSProperties> = {
      default: styles.countBtnDefault,
      correct: {
        ...styles.countBtnActive,
        background: "#E1F5EE",
        borderColor: "#5DCAA5",
        color: "#085041",
      },
      wrong: {
        ...styles.countBtnActive,
        background: "#FAECE7",
        borderColor: "#F0997B",
        color: "#993C1D",
      },
      revealedWrong: {
        background: "#fff",
        borderColor: "#B4B2A9",
        color: "#2C2C2A",
      },
    };
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.progressInfo}>
              <span>
                Question {current + 1} / {questions.length}
              </span>
              <span style={{ fontWeight: 500 }}>
                Score: {score} / {questions.length}
              </span>
            </div>
            <div style={styles.progressWrap}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${((current + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div style={styles.questionBlock}>
              <h3 style={{ ...styles.cardTitle, marginBottom: 16, fontSize: 17 }}>
                {q.question}
              </h3>
              <div style={styles.answersGrid}>
                {q.choices.map((choice) => {
                  let btnStyle: React.CSSProperties = answerColors.default;
                  if (result && choice === selectedAnswer) {
                    btnStyle = result === "correct" ? answerColors.correct : answerColors.wrong;
                  } else if (result && result === "wrong" && choice === q.answer) {
                    btnStyle = answerColors.revealedWrong;
                  }

                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleAnswer(choice)}
                      disabled={result !== null}
                      style={btnStyle}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            {result !== null && (
              <div style={styles.resultBar}>
                <span
                  style={{
                    color: result === "correct" ? "#085041" : "#993C1D",
                    fontWeight: 500,
                  }}
                >
                  {result === "correct" ? "✅ Correct!" : `❌ Wrong! Answer: ${q.answer}`}
                </span>
                <button
                  type="button"
                  onClick={nextQuestion}
                  style={styles.nextBtn}
                >
                  {current + 1 >= questions.length ? "Finish" : "Next →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

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
  header: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  backBtn: {
    border: "0.5px solid #D3D1C7",
    background: "#fff",
    color: "#2C2C2A",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    textAlign: "left" as const,
  },
  card: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
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
  playerGrid: {
    display: "grid",
    gap: 8,
  },
  playerCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "0.5px solid",
    borderRadius: 10,
    padding: "0.85rem 1rem",
    cursor: "pointer",
    width: "100%",
    textAlign: "left" as const,
    background: "#fff",
  },
  playerCardDefault: {
    borderColor: "#D3D1C7",
  },
  playerCardActive: {
    borderColor: "#3C3489",
    background: "#F8F7FF",
  },
  countGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 16,
  },
  countBtn: {
    borderRadius: 8,
    padding: "0.75rem 0.5rem",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    border: "0.5px solid",
    transition: "background 0.15s, transform 0.1s",
    width: "100%",
  },
  countBtnDefault: {
    background: "#fff",
    borderColor: "#B4B2A9",
    color: "#2C2C2A",
  },
  countBtnActive: {
    background: "#EEEDFE",
    borderColor: "#3C3489",
    color: "#3C3489",
  },
  startBtn: {
    border: "0.5px solid #3C3489",
    borderRadius: 8,
    background: "#EEEDFE",
    color: "#3C3489",
    padding: "0.85rem 1rem",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
  },
  secondaryBtn: {
    border: "0.5px solid #D3D1C7",
    borderRadius: 8,
    background: "#fff",
    color: "#2C2C2A",
    padding: "0.85rem 1rem",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },
  loadingText: {
    color: "#888780",
    fontSize: 14,
    padding: "8px 0",
  },
  errorText: {
    color: "#A32D2D",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#888780",
    marginBottom: 6,
  },
  progressWrap: {
    height: 6,
    background: "#F1EFE8",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    borderRadius: 20,
    background: "#1D9E75",
    transition: "width 0.4s ease",
  },
  questionBlock: {
    marginTop: 8,
  },
  answersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 8,
  },
  resultBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#F1EFE8",
  },
  nextBtn: {
    border: "0.5px solid #3C3489",
    borderRadius: 8,
    background: "#EEEDFE",
    color: "#3C3489",
    padding: "0.55rem 1rem",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  scoreItem: {
    flex: 1,
    borderRadius: 10,
    padding: "0.85rem",
    textAlign: "center" as const,
    fontSize: 13,
  },
  scoreBreakdown: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
};

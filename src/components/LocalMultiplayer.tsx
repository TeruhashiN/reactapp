import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type QuizQuestion = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const COUNT_OPTIONS = [5, 10, 20, 50, 100];

interface CustomWindow extends Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}
const win = window as CustomWindow;

function playTone(freq: number, duration: number) {
  try {
    const ACtx = win.AudioContext || win.webkitAudioContext;
    const ctx = new ACtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // ignore audio errors
  }
}

export default function LocalMultiplayer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const countParam = parseInt(searchParams.get("count") || "10", 10);
  const questionCount = COUNT_OPTIONS.includes(countParam) ? countParam : 10;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = questions[current];

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const res = await fetch(
        `http://localhost:4000/api/timer-quiz/questions?count=${questionCount}`
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [questionCount]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function handleSelect(opt: string) {
    if (!q || finished) return;
    const chosenText = opt.replace(/^[A-D]\. /, "");
    const ok = chosenText === q.answer;
    setSelected(opt);
    playTone(ok ? 600 : 300, ok ? 80 : 150);

    const newScores: [number, number] = [...scores];
    if (activePlayer === 1) {
      if (ok) newScores[0] = scores[0] + 1;
    } else {
      if (ok) newScores[1] = scores[1] + 1;
    }
    setScores(newScores);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setActivePlayer((p) => (p === 1 ? 2 : 1));
      }
    }, 350);
  }

  function handleRestart() {
    playTone(400, 120);
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScores([0, 0]);
    setActivePlayer(1);
    fetchQuestions();
  }

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <p style={{ textAlign: "center", color: "#888780" }}>
                Loading questions…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <p style={{ color: "#A32D2D", textAlign: "center", marginBottom: 16 }}>
                {error || "No questions available."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => setSearchParams({ count: "10" })} style={{ ...s.btn, ...s.btnPrimary }}>
                  Retry default
                </button>
                <button onClick={() => navigate("/dashboard")} style={{ ...s.btn, ...s.btnGhost }}>
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const winner = scores[0] > scores[1] ? "Player 1" : scores[1] > scores[0] ? "Player 2" : "Draw!";
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <h2 style={s.resultTitle}>Game Over!</h2>
              <div style={s.scoresGrid}>
                <div style={{ ...s.scoreBox, background: "#E8E4FF", color: "#3C3489" }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Player 1</div>
                  <div style={{ fontSize: 28 }}>{scores[0]}</div>
                </div>
                <div style={{ ...s.scoreBox, background: "#FFE5D9", color: "#993C1D" }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Player 2</div>
                  <div style={{ fontSize: 28 }}>{scores[1]}</div>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 16, margin: "16px 0" }}>{winner}</p>
              <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                <button onClick={handleRestart} style={{ ...s.btn, ...s.btnPrimary }}>
                  ↺ Play Again
                </button>
                <button onClick={() => navigate("/dashboard")} style={{ ...s.btn, ...s.btnGhost }}>
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.cardBody}>
            <div style={s.quizHeader}>
              <button onClick={() => navigate("/dashboard")} style={s.backBtn}>
                ← Back
              </button>
              <span style={s.levelBadge}>Local Multiplayer</span>
              <span style={s.qCounter}>
                Q {current + 1} / {questions.length}
              </span>
            </div>

            <div style={s.activePlayerBanner}>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: activePlayer === 1 ? "#3C3489" : "#993C1D",
                background: activePlayer === 1 ? "#E8E4FF" : "#FFE5D9",
                padding: "6px 12px",
                borderRadius: 20,
              }}>
                {activePlayer === 1 ? "👤 Player 1's Turn" : "👤 Player 2's Turn"}
              </span>
            </div>

            <div style={s.scoresGrid}>
              <div style={{ ...s.scoreBox, background: "#E8E4FF", opacity: activePlayer === 1 ? 1 : 0.5 }}>
                <div style={{ fontWeight: 600 }}>P1</div>
                <div style={{ fontSize: 20 }}>{scores[0]}</div>
              </div>
              <div style={{ ...s.scoreBox, background: "#FFE5D9", opacity: activePlayer === 2 ? 1 : 0.5 }}>
                <div style={{ fontWeight: 600 }}>P2</div>
                <div style={{ fontSize: 20 }}>{scores[1]}</div>
              </div>
            </div>

            <p style={s.questionLabel}>What does this word mean?</p>
            <h3 style={s.questionText}>"{q.word}"</h3>

            <div style={s.optionsGrid}>
              {q.options.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    ...s.optionBtn,
                    ...(selected === opt ? s.optionSelected : {}),
                  }}
                >
                  <span
                    style={{
                      ...s.optLetter,
                      ...(selected === opt ? s.optLetterSelected : {}),
                    }}
                  >
                    {OPTION_LETTERS[i]}
                  </span>
                  <span>{opt.replace(/^[A-D]\. /, "")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f4f0",
    padding: "24px 16px 64px",
    fontFamily: "'DM Sans', sans-serif",
  },
  container: {
    maxWidth: 560,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardBody: {
    padding: "1.5rem",
  },
  quizHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#534AB7",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: 6,
    fontFamily: "inherit",
  },
  levelBadge: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18,
    color: "#2C2C2A",
  },
  qCounter: {
    fontSize: 12,
    color: "#888780",
    background: "#F1EFE8",
    border: "0.5px solid #D3D1C7",
    padding: "4px 10px",
    borderRadius: 20,
  },
  activePlayerBanner: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  scoresGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: "1.25rem",
  },
  scoreBox: {
    flex: 1,
    borderRadius: 10,
    padding: "0.75rem",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "inherit",
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#888780",
    marginBottom: 6,
    textAlign: "center" as const,
  },
  questionText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    fontWeight: 400,
    color: "#2C2C2A",
    marginBottom: "1.5rem",
    lineHeight: 1.3,
    textAlign: "center" as const,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  optionBtn: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "0.875rem 1rem",
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13.5,
    fontWeight: 400,
    color: "#2C2C2A",
    textAlign: "left" as const,
    transition: "all 0.15s ease",
  },
  optionSelected: {
    background: "#E8E4FF",
    borderColor: "#7F77DD",
    color: "#3C3489",
  },
  optLetter: {
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: "50%",
    border: "1px solid #D3D1C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#5F5E5A",
    marginTop: 1,
    transition: "all 0.15s",
  },
  optLetterSelected: {
    background: "#3C3489",
    borderColor: "#3C3489",
    color: "#fff",
  },
  btn: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.15s, transform 0.1s",
  },
  btnPrimary: {
    background: "#3C3489",
    color: "#fff",
  },
  btnGhost: {
    background: "#F1EFE8",
    color: "#2C2C2A",
    border: "0.5px solid #D3D1C7",
  },
  resultTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26,
    fontWeight: 400,
    color: "#2C2C2A",
    textAlign: "center" as const,
    marginBottom: "0.5rem",
  },
};
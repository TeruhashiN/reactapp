import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type QuizQuestion = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const COUNT_OPTIONS = [5, 10, 20, 50, 100];
const TIME_OPTIONS = [60, 300, 600];

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

export default function TimerQuiz() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const countParam = parseInt(searchParams.get("count") || "20", 10);
  const timeParam = parseInt(searchParams.get("time") || "60", 10);
  const questionCount = COUNT_OPTIONS.includes(countParam) ? countParam : 20;
  const totalTime = TIME_OPTIONS.includes(timeParam) ? timeParam : 60;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = questions[current];
  const total = questions.length;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const res = await fetch(
        `/api/timer-quiz/questions?count=${questionCount}`
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

  useEffect(() => {
    setTimeLeft(totalTime);
  }, [totalTime]);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [finished, timeLeft]);

  function handleSelect(opt: string) {
    if (!q || finished) return;
    const chosenText = opt.replace(/^[A-D]\. /, "");
    const ok = chosenText === q.answer;
    setSelected(opt);
    setScore((s) => s + (ok ? 1 : 0));
    playTone(ok ? 600 : 300, ok ? 80 : 150);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
      }
    }, 350);
  }

  function handleRestart() {
    playTone(400, 120);
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(totalTime);
    fetchQuestions();
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft <= 10 ? "#E24B4A" : "#2C2C2A";

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
                <button onClick={() => setSearchParams({})} style={{ ...s.btn, ...s.btnPrimary }}>
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
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <h2 style={s.resultTitle}>Time's Up!</h2>
              <div style={{ ...s.timerDisplay, color: "#1D9E75", margin: "1.5rem 0" }}>
                <span style={s.timerBig}>{score}</span>
                <span style={s.timerLabel}>points</span>
              </div>
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
              <span style={s.levelBadge}>Level Timer Quiz</span>
              <span style={s.qCounter}>
                {current + 1} / {total}
              </span>
            </div>

            <div style={s.settingsRow}>
              <div style={s.settingGroup}>
                <span style={s.settingLabel}>Questions</span>
                <div style={s.pillRow}>
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setSearchParams({ count: String(n), time: String(totalTime) })
                      }
                      style={{
                        ...s.pill,
                        ...(questionCount === n ? s.pillActive : s.pillInactive),
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.settingGroup}>
                <span style={s.settingLabel}>Time</span>
                <div style={s.pillRow}>
                  {[
                    { value: 60, label: "1m" },
                    { value: 300, label: "5m" },
                    { value: 600, label: "10m" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setSearchParams({ count: String(questionCount), time: String(value) })
                      }
                      style={{
                        ...s.pill,
                        ...(totalTime === value ? s.pillActive : s.pillInactive),
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.timerDisplay}>
              <span style={{ ...s.timerBig, color: timerColor }}>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
              <span style={s.timerLabel}>remaining</span>
            </div>

            <div style={s.scoreDisplay}>
              <span style={s.scoreBig}>{score}</span>
              <span style={s.scoreLabel}>points</span>
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
  settingsRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    marginBottom: "1rem",
  },
  settingGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#888780",
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  pill: {
    border: "0.5px solid",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "inherit",
  },
  pillActive: {
    background: "#EEEDFE",
    color: "#3C3489",
    borderColor: "#AFA9EC",
  },
  pillInactive: {
    background: "#fff",
    color: "#2C2C2A",
    borderColor: "#D3D1C7",
  },
  timerDisplay: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginBottom: "1rem",
  },
  timerBig: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 56,
    fontWeight: 400,
    lineHeight: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: "#888780",
    marginTop: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  scoreDisplay: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  scoreBig: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 36,
    fontWeight: 400,
    color: "#1D9E75",
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#888780",
    marginTop: 2,
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
    background: "#EEEDFE",
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
  },
};

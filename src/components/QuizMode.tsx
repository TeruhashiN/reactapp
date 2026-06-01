import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type QuizQuestion = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

type AnswerRecord = {
  word: string;
  chosen: string;
  correct: string;
  ok: boolean;
};

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
type ToneType = OscillatorType;

function playTone(freq: number, duration: number, type?: ToneType, vol?: number) {
  try {
    const w = window as any;
    const ctx = new (w.AudioContext || w.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type ?? "sine";
    osc.frequency.value = freq;
    gain.gain.value = vol ?? 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
}

async function fetchBestForLevel(level: number): Promise<number> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return 0;
    const res = await fetch(`http://localhost:4000/api/me/scores?level=${level}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const entry = data.scores.find((s: { level: number }) => s.level === level);
    return entry?.best_score ?? 0;
  } catch {
    return 0;
  }
}

async function saveLevelScore(
  token: string,
  level: number,
  score: number,
): Promise<{ ok: boolean; total: number }> {
  try {
    const res = await fetch(`http://localhost:4000/api/me/level-score`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level, score }),
    });
    if (!res.ok) return { ok: false, total: 0 };
    const data = await res.json();
    return { ok: true, total: data.total };
  } catch {
    return { ok: false, total: 0 };
  }
}

export default function QuizMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get("level") || "1", 10);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [, setAwarded] = useState<Record<number, boolean>>({});

  const [isNewBest, setIsNewBest] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ringRef = useRef<SVGCircleElement>(null);
  const pressedKeys = useRef<Set<string>>(new Set());

  const handleSelectRef = useRef<(opt: string) => void>(() => {});
  const handleNextRef = useRef<() => void>(() => {});

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:4000/api/quiz/questions?level=${level}&limit=50`,
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetchBestForLevel(level).then(setBestScore);
  }, [level]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished) return;
      const key = e.key.toUpperCase();

      if (key === "ENTER" && selected) {
        handleNextRef.current();
        return;
      }

      const idx = OPTION_LETTERS.indexOf(key as any);
      if (idx >= 0 && idx < (questions[current]?.options.length ?? 0)) {
        if (pressedKeys.current.has(key)) return;
        pressedKeys.current.add(key);
        handleSelectRef.current(questions[current].options[idx]);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      pressedKeys.current.delete(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [finished, questions, current, selected]);

  useEffect(() => {
    if (!finished || !ringRef.current || questions.length === 0) return;
    const pct = score / questions.length;
    const circumference = 314;
    const offset = circumference - pct * circumference;
    const el = ringRef.current;
    el.style.transition = "none";
    el.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)";
        el.style.strokeDashoffset = String(offset);
      });
    });
  }, [finished, score, questions.length]);

  function handleSelect(opt: string) {
    const q = questions[current];
    if (!q) return;

    const chosenText = opt.replace(/^[A-D]\. /, "");
    const ok = chosenText === q.answer;

    const prevCorrect = Boolean(answers.find((a) => a.word === q.word)?.ok);

    setSelected(opt);

    setAwarded((prev) => {
      const next = { ...prev };
      next[current] = ok;
      return next;
    });

    setScore((s) => {
      if (!prevCorrect && ok) return s + 1;
      if (prevCorrect && !ok) return s - 1;
      return s;
    });

    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.word === q.word);
      const rec: AnswerRecord = {
        word: q.word,
        chosen: opt,
        correct: q.answer,
        ok,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = rec;
        return next;
      }
      return [...prev, rec];
    });

    playTone(500, 40, "sine", 0.06);
  }

  handleSelectRef.current = handleSelect;

  function handleNext() {
    playTone(520, 60, "sine", 0.08);
    if (current + 1 >= questions.length) {
      finishQuiz();
      return;
    }
    const next = current + 1;
    setCurrent(next);
    const existing = answers.find((a) => a.word === questions[next]?.word);
    setSelected(existing ? existing.chosen : null);
  }

  handleNextRef.current = handleNext;

  function handlePrev() {
    if (current <= 0) return;
    const prev = current - 1;
    setCurrent(prev);
    const existing = answers.find((a) => a.word === questions[prev]?.word);
    setSelected(existing ? existing.chosen : null);
  }

  async function finishQuiz() {
    playTone(400, 150, "sine", 0.15);
    setTimeout(() => playTone(600, 150, "sine", 0.15), 160);
    setTimeout(() => playTone(800, 300, "sine", 0.2), 320);

    const token = localStorage.getItem("token");
    let storedBest = 0;
    if (token) {
      const r = await fetchBestForLevel(level);
      storedBest = r;
    }
    const newBest = score > storedBest;
    setIsNewBest(newBest);
    setBestScore(score > storedBest ? score : storedBest);
    setFinished(true);
    if (token && newBest) {
      const result = await saveLevelScore(token, level, score);
      setIsNewBest(result.ok);
    }
  }

  async function handleRestart() {
    playTone(400, 120, "sine", 0.1);
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setAwarded({});
    setIsNewBest(false);
    const best = await fetchBestForLevel(level);
    setBestScore(best);
    fetchQuestions();
  }

  const q = questions[current];
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const progressPct = total > 0 ? ((current + 1) / total) * 100 : 0;

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.stripe} />
            <div style={s.cardBody}>
              <p style={{ textAlign: "center", color: "#888780", fontSize: 14 }}>
                Loading questions…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.stripe} />
            <div style={s.cardBody}>
              <p
                style={{
                  color: "#A32D2D",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {error}
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ ...s.btn, ...s.btnGhost }}
              >
                ← Back to Dashboard
              </button>
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
            <div style={s.stripe} />
            <div style={s.cardBody}>
              <div style={s.resultHeader}>
                <h2 style={s.resultTitle}>Results</h2>
                {isNewBest && <span style={s.newBestBadge}>🏆 New best!</span>}
              </div>

              <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: 120,
                    height: 120,
                  }}
                >
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#F1EFE8"
                      strokeWidth="10"
                    />
                    <circle
                      ref={ringRef}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#1D9E75"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="314"
                      strokeDashoffset="314"
                    />
                  </svg>
                  <div style={s.ringText}>
                    <span style={s.ringPct}>{pct}%</span>
                    <span style={s.ringSub}>
                      {score}/{total}
                    </span>
                  </div>
                </div>
              </div>

              <div style={s.statsGrid}>
                <div style={s.statCard}>
                  <div style={s.statVal}>{score}</div>
                  <div style={s.statLabel}>Correct</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statVal}>{total - score}</div>
                  <div style={s.statLabel}>Wrong</div>
                </div>
                <div style={{ ...s.statCard }}>
                  <div style={{ ...s.statVal, color: "#534AB7" }}>{bestScore}</div>
                  <div style={s.statLabel}>Best score</div>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={s.sectionLabel}>Question review</p>
                {answers.map((a, i) => {
                  const chosenText = a.chosen.replace(/^[A-D]\. /, "");
                  return (
                    <div key={i} style={s.answerRow}>
                      <span
                        style={{
                          ...s.ansIcon,
                          ...(a.ok ? s.ansIconOk : s.ansIconBad),
                        }}
                      >
                        {a.ok ? "✓" : "✗"}
                      </span>
                      <div>
                        <div style={s.ansWord}>{a.word}</div>
                        <div style={s.ansDetail}>
                          {a.ok ? (
                            <span style={{ color: "#0F6E56" }}>{a.correct}</span>
                          ) : (
                            <>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "#E24B4A",
                                }}
                              >
                                {chosenText}
                              </span>
                              {" → "}
                              <span style={{ color: "#0F6E56" }}>{a.correct}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={s.actionsRow}>
                <button
                  onClick={handleRestart}
                  style={{ ...s.btn, ...s.btnPrimary }}
                >
                  ↺ Try Again
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  style={{ ...s.btn, ...s.btnGhost }}
                >
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
          <div style={s.stripe} />
          <div style={s.cardBody}>
            <div style={s.quizHeader}>
              <button onClick={() => navigate("/dashboard")} style={s.backBtn}>
                ← Back
              </button>
              <span style={s.levelBadge}>Level {level} Quiz</span>
              <span style={s.qCounter}>
                {current + 1} of {total}
              </span>
            </div>

            <div style={s.progressWrap}>
              <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
            </div>

            <div style={s.bestScoreCard}>
              <span style={s.bestScoreTrophy}>🏆</span>
              <div>
                <div style={s.bestScoreLabel}>Best Score</div>
                <div style={s.bestScoreVal}>
                  {bestScore}
                  <span style={s.bestScoreOf}> / {total || "—"}</span>
                </div>
              </div>
            </div>

            <p style={s.questionLabel}>What does this word mean?</p>
            <h3 style={s.questionText}>"{q.word}"</h3>

            <div style={s.optionsGrid}>
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    style={{
                      ...s.optionBtn,
                      ...(isSelected ? s.optionSelected : {}),
                    }}
                  >
                    <span
                      style={{
                        ...s.optLetter,
                        ...(isSelected ? s.optLetterSelected : {}),
                      }}
                    >
                      {OPTION_LETTERS[i]}
                    </span>
                    <span style={{ lineHeight: 1.4 }}>
                      {opt.replace(/^[A-D]\. /, "")}
                    </span>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div style={{ marginTop: "1.25rem" }}>
                <button
                  onClick={handleNext}
                  style={{ ...s.btn, ...s.btnPrimary }}
                >
                  {current + 1 >= total ? "See Results" : "Next Question"} →
                </button>
              </div>
            )}
          </div>
        </div>

        {current > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={handlePrev} style={s.prevBtn}>
              ← Previous question
            </button>
          </div>
        )}
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
  stripe: {
    height: 4,
    background: "linear-gradient(90deg, #534AB7 0%, #1D9E75 100%)",
  },
  cardBody: {
    padding: "1.5rem",
  },
  quizHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
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
  progressWrap: {
    height: 5,
    background: "#F1EFE8",
    border: "0.5px solid #D3D1C7",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: "1rem",
  },
  progressFill: {
    height: "100%",
    background: "#1D9E75",
    borderRadius: 10,
    transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
  },
  bestScoreCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#F8F7FF",
    border: "0.5px solid #C8C4F0",
    borderRadius: 10,
    padding: "0.65rem 1rem",
    marginBottom: "1.25rem",
  },
  bestScoreTrophy: {
    fontSize: 20,
    lineHeight: 1,
  },
  bestScoreLabel: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    color: "#888780",
    marginBottom: 1,
  },
  bestScoreVal: {
    fontSize: 18,
    fontWeight: 600,
    color: "#534AB7",
    lineHeight: 1,
  },
  bestScoreOf: {
    fontSize: 12,
    fontWeight: 400,
    color: "#888780",
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#888780",
    marginBottom: 6,
  },
  questionText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    fontWeight: 400,
    color: "#2C2C2A",
    marginBottom: "1.5rem",
    lineHeight: 1.3,
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
  optionCorrect: {
    background: "#E1F5EE",
    borderColor: "#1D9E75",
    color: "#085041",
  },
  optionWrong: {
    background: "#FCEBEB",
    borderColor: "#E24B4A",
    color: "#791F1F",
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
  optLetterCorrect: {
    background: "#1D9E75",
    borderColor: "#1D9E75",
    color: "#fff",
  },
  optLetterWrong: {
    background: "#E24B4B",
    borderColor: "#E24B4A",
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
  prevBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#5F5E5A",
    padding: "4px 6px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  resultTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26,
    fontWeight: 400,
    color: "#2C2C2A",
  },
  newBestBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "#FAEEDA",
    border: "0.5px solid #FAC775",
    borderRadius: 20,
    padding: "3px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#633806",
  },
  ringText: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 30,
    color: "#2C2C2A",
    lineHeight: 1,
  },
  ringSub: {
    fontSize: 12,
    color: "#888780",
    marginTop: 2,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginBottom: "1.5rem",
  },
  statCard: {
    background: "#F1EFE8",
    borderRadius: 8,
    border: "0.5px solid #D3D1C7",
    padding: "0.75rem",
    textAlign: "center" as const,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 600,
    color: "#2C2C2A",
  },
  statLabel: {
    fontSize: 11,
    color: "#888780",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#888780",
    marginBottom: 10,
  },
  answerRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "8px 0",
    borderBottom: "0.5px solid #F1EFE8",
    fontSize: 13,
  },
  ansIcon: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    flexShrink: 0,
    marginTop: 1,
    fontWeight: 600,
  },
  ansIconOk: {
    background: "#E1F5EE",
    color: "#0F6E56",
    border: "0.5px solid #1D9E75",
  },
  ansIconBad: {
    background: "#FCEBEB",
    color: "#E24B4A",
    border: "0.5px solid #E24B4A",
  },
  ansWord: {
    fontWeight: 500,
    color: "#2C2C2A",
  },
  ansDetail: {
    color: "#888780",
    marginTop: 1,
  },
  actionsRow: {
    display: "flex",
    gap: 10,
  },
};

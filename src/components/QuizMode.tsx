import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type QuizQuestion = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

export default function QuizMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get("level") || "1", 10);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<
    { word: string; chosen: string; correct: string; ok: boolean }[]
  >([]);

  const [revealAnswers, setRevealAnswers] = useState(false);

  // Used for “back to previous question” during the quiz
  const [visited, setVisited] = useState<number[]>([0]);

  // Track whether we already awarded points for each question, so Prev never double-counts.
  const [, setAwarded] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function handleSelect(option: string) {
    const q = questions[current];
    const chosenText = option.replace(/^[A-D]\. /, "");
    const ok = chosenText === q.answer;

    // Allow re-visiting questions: only count points once per question.
    setSelected(option);

    setAwarded((prev) => {
      const already = prev[current] === true;
      if (ok && !already) {
        setScore((s) => s + 1);
        return { ...prev, [current]: true };
      }
      // If wrong, we never award.
      return prev;
    });

    // Save answer now, but do NOT reveal correctness in the UI until the end.
    setAnswers((prev) => {
      const existingIdx = prev.findIndex((a) => a.word === q.word);
      const next = [...prev];
      if (existingIdx >= 0) {
        next[existingIdx] = {
          word: q.word,
          chosen: option,
          correct: q.answer,
          ok,
        };
        return next;
      }
      return [...prev, { word: q.word, chosen: option, correct: q.answer, ok }];
    });
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setRevealAnswers(true);
      setFinished(true);
    } else {
      const next = current + 1;
      setVisited((v) => (v.includes(next) ? v : [...v, next]));
      setCurrent(next);

      // Restore previously selected answer for next question (if any).
      const nextQ = questions[next];
      const existing = answers.find((a) => a.word === nextQ?.word);
      setSelected(existing ? existing.chosen : null);

      setRevealAnswers(false);
    }
  }

  function handlePrev() {
    if (current <= 0) return;
    const idx = visited.lastIndexOf(current);
    const prevIndex = idx > 0 ? visited[idx - 1] : current - 1;
    const nextCurrent = Math.max(0, prevIndex);

    setCurrent(nextCurrent);

    // Restore previously selected answer for that question (so UI shows it).
    const existing = answers.find(
      (a) => a.word === questions[nextCurrent]?.word,
    );
    setSelected(existing ? existing.chosen : null);

    // When moving back, don't reveal correctness immediately.
    setRevealAnswers(false);
  }

  function handleRestart() {
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setRevealAnswers(false);
    setVisited([0]);
    setAwarded({});
    fetchQuestions();
  }

  const q = questions[current];
  const pct =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const levelStart = (level - 1) * 50;
  const levelScore = Math.max(0, score);

  // best highscore per level (localStorage)
  const STORAGE_KEY = "bestHighScoreByLevel_v1";

  const getBestForLevel = (lvl: number, currentGlobalScore?: number) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let map: Record<string, number> = {};
    if (raw) {
      try {
        map = JSON.parse(raw) || {};
      } catch {
        map = {};
      }
    }

    // Only show bests for levels <= current level (based on current global score)
    if (typeof currentGlobalScore === "number") {
      const maxLevel = Math.min(10, Math.floor(currentGlobalScore / 50) + 1);
      if (lvl > maxLevel) return 0;
    }

    return map[String(lvl)] ?? 0;
  };

  const [meScore, setMeScore] = useState<number | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const run = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data: { user: { score: number } } = await res.json();
        setMeScore(data.user.score ?? 0);
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  const computedLevelScore = (() => {
    // Requirement: per-level starts from -50 starting from L2.
    // With global score ranges of 50: L2 (50..99) => 0..49.
    // That is effectively: globalScore - (level-1)*50, but never below 0.
    if (meScore == null) return levelScore;
    return Math.max(0, meScore - levelStart);
  })();

  const bestHighScoreThisLevel = getBestForLevel(level, meScore ?? undefined);

  const updateBestForLevel = (lvl: number, nextLevelScore: number) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let map: Record<string, number> = {};
    if (raw) {
      try {
        map = JSON.parse(raw) || {};
      } catch {
        map = {};
      }
    }

    const prev = map[String(lvl)] ?? 0;

    // Update rules (per your request):
    // - If next is the same or higher than prev, replace stored best with next.
    // - If next is lower than prev, do nothing.
    // This prevents accumulated wrong values like 13 -> 34 -> 47.
    const shouldUpdate = nextLevelScore >= prev;
    map[String(lvl)] = shouldUpdate ? nextLevelScore : prev;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  };

  const updateUserScore = async (delta: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Only update via backend when we have a valid endpoint.
    // We keep it defensive: if backend doesn't support it, UI still works.
    try {
      await fetch("http://localhost:4000/api/me/score", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delta }),
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!finished) return;

    // 1) Update user score (backend if supported)
    // Assumption: each correct answer grants +1 point (matches current UI).
    updateUserScore(score);

    // 2) Update best highscore per level (localStorage UI)
    // Requirement: only reflect bests that are <= current global score.
    // We compute the resulting level-relative score based on current global score.
    if (meScore == null) {
      updateBestForLevel(level, levelScore);
      return;
    }

    // Use meScore + score (because we've just earned points).
    const resultingGlobalScore = meScore + score;
    const resultingLevelStart = (level - 1) * 50;
    const resultingLevelRelativeScore = Math.max(
      0,
      resultingGlobalScore - resultingLevelStart,
    );

    updateBestForLevel(level, resultingLevelRelativeScore);
  }, [finished, level, computedLevelScore, meScore, levelScore, score]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.quizCard}>
            <p style={{ textAlign: "center" }}>Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.quizCard}>
            <p style={{ color: "#A32D2D", textAlign: "center" }}>{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ ...styles.btn, ...styles.btnGhost, marginTop: 12 }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.resultCard}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <button
                onClick={() => navigate("/dashboard")}
                style={styles.backBtn}
              >
                ← Back
              </button>
              <h2
                style={{
                  ...styles.resultTitle,
                  flex: 1,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Quiz Complete!
              </h2>
            </div>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 48, marginBottom: "0.5rem" }}>
                {pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📖"}
              </div>
              <p style={styles.resultText}>
                You scored <strong>{score}</strong> out of{" "}
                <strong>{questions.length}</strong> — ({pct}%)
              </p>

              <div style={{ marginTop: 10 }}>
                <p style={{ ...styles.resultText, margin: 0 }}>
                  Level {level} score: <strong>{computedLevelScore}</strong>
                  {meScore != null ? (
                    <>
                      {" "}
                      / best: <strong>{bestHighScoreThisLevel}</strong>
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div style={styles.answersList}>
              {answers.map((a, i) => (
                <div key={i} style={styles.answerRow}>
                  <span
                    style={{
                      ...styles.answerIndicator,
                      color: a.ok ? "#166534" : "#991b1b",
                    }}
                  >
                    {a.ok ? "✓" : "✗"}
                  </span>
                  <span style={styles.answerText}>
                    {a.word}:{" "}
                    {a.ok ? (
                      a.correct
                    ) : (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#991b1b",
                          }}
                        >
                          {a.chosen}
                        </span>{" "}
                        → {a.correct}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#888780" }}>
                Best score card is stored per level.
              </p>
            </div>

            <div style={styles.actionsRow}>
              <button
                onClick={handleRestart}
                style={{ ...styles.btn, ...styles.btnPrimary }}
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{ ...styles.btn, ...styles.btnGhost }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.quizCard}>
          <div style={styles.header}>
            <button
              onClick={() => navigate("/dashboard")}
              style={styles.backBtn}
            >
              ← Back
            </button>

            {current > 0 ? (
              <button onClick={handlePrev} style={styles.backBtn}>
                ← Question
              </button>
            ) : (
              <span style={{ width: 110 }} />
            )}

            <h2 style={styles.headerTitle}>Level {level} Quiz</h2>
            <span style={styles.counter}>
              Question {current + 1} of {questions.length}
            </span>
          </div>

          <div style={styles.progressBarWrap}>
            <div
              style={{
                ...styles.progressBar,
                width: `${(current / questions.length) * 100}%`,
              }}
            />
          </div>

          <h3 style={styles.question}>What does "{q.word}" mean?</h3>

          <div style={styles.optionsGrid}>
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOption =
                revealAnswers && opt.replace(/^[A-D]\. /, "") === q.answer;

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                  style={{
                    ...styles.option,
                    ...(revealAnswers && isCorrectOption
                      ? styles.optionCorrect
                      : {}),
                    ...(isSelected && !isCorrectOption && revealAnswers
                      ? styles.optionWrong
                      : {}),
                    ...(isSelected ? styles.optionSelected : {}),
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={styles.nextBtnWrap}>
              <button
                onClick={handleNext}
                style={{ ...styles.btn, ...styles.btnPrimary }}
              >
                {current + 1 >= questions.length
                  ? "See Results"
                  : "Next Question"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f4f0",
    padding: "24px 16px 48px",
  },
  container: {
    maxWidth: 560,
    margin: "0 auto",
  },
  quizCard: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#3C3489",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    borderRadius: 6,
    transition: "background 0.15s ease",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  counter: {
    fontSize: 13,
    color: "#888780",
  },
  progressBarWrap: {
    height: 6,
    background: "#F1EFE8",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: "1.25rem",
  },
  progressBar: {
    height: "100%",
    background: "#1D9E75",
    transition: "width 0.3s ease",
  },
  question: {
    fontSize: 18,
    fontWeight: 500,
    margin: "0 0 1rem",
    lineHeight: 1.4,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  option: {
    padding: "1rem",
    fontSize: 14,
    fontWeight: 500,
    border: "1px solid #D3D1C7",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left" as const,
  },
  optionCorrect: {
    background: "#E8F5E9",
    borderColor: "#166534",
    color: "#166534",
  },
  optionWrong: {
    background: "#FFEBEE",
    borderColor: "#991b1b",
    color: "#991b1b",
  },
  optionSelected: {
    background: "#EEF2FF",
    borderColor: "#3C3489",
    color: "#3C3489",
  },

  nextBtnWrap: {
    marginTop: "1.5rem",
  },
  resultCard: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.5rem",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 6px",
  },
  resultText: {
    fontSize: 14,
    color: "#888780",
    margin: 0,
  },
  answersList: {
    marginBottom: "1.5rem",
  },
  answerRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 0",
    borderBottom: "1px solid #F1EFE8",
  },
  answerIndicator: {
    fontSize: 16,
    fontWeight: 600,
    flexShrink: 0,
    marginTop: 2,
  },
  answerText: {
    fontSize: 13,
  },
  actionsRow: {
    display: "flex",
    gap: 12,
  },
  btn: {
    flex: 1,
    padding: "0.75rem 1rem",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
  },
  btnPrimary: {
    background: "#3C3489",
    color: "#fff",
  },
  btnGhost: {
    background: "#F1EFE8",
    color: "#2C2C2A",
  },
};

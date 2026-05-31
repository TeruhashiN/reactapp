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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:4000/api/quiz/questions?level=${level}&limit=50`);
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
    if (selected) return;
    const q = questions[current];
    const chosenText = option.replace(/^[A-D]\. /, "");
    const ok = chosenText === q.answer;
    setSelected(option);
    if (ok) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { word: q.word, chosen: option, correct: q.answer, ok }]);
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  function handleRestart() {
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    fetchQuestions();
  }

  const q = questions[current];
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

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
            <button onClick={() => navigate("/dashboard")} style={{ ...styles.btn, ...styles.btnGhost, marginTop: 12 }}>
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
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
              <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
                ← Back
              </button>
              <h2 style={{ ...styles.resultTitle, flex: 1, textAlign: "center", margin: 0 }}>
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
            </div>

            <div style={styles.answersList}>
              {answers.map((a, i) => (
                <div key={i} style={styles.answerRow}>
                  <span style={{
                    ...styles.answerIndicator,
                    color: a.ok ? "#166534" : "#991b1b",
                  }}>
                    {a.ok ? "✓" : "✗"}
                  </span>
                  <span style={styles.answerText}>
                    {a.word}:{" "}
                    {a.ok ? (
                      a.correct
                    ) : (
                      <>
                        <span style={{ textDecoration: "line-through", color: "#991b1b" }}>
                          {a.chosen}
                        </span>
                        {" "}→ {a.correct}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.actionsRow}>
              <button onClick={handleRestart} style={{ ...styles.btn, ...styles.btnPrimary }}>
                Try Again
              </button>
              <button onClick={() => navigate("/dashboard")} style={{ ...styles.btn, ...styles.btnGhost }}>
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
            <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
              ← Back
            </button>
            <h2 style={styles.headerTitle}>Level {level} Quiz</h2>
            <span style={styles.counter}>Question {current + 1} of {questions.length}</span>
          </div>

          <div style={styles.progressBarWrap}>
            <div style={{ ...styles.progressBar, width: `${(current / questions.length) * 100}%` }} />
          </div>

          <h3 style={styles.question}>What does "{q.word}" mean?</h3>

          <div style={styles.optionsGrid}>
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt.replace(/^[A-D]\. /, "") === q.answer;
              const showCorrect = selected && isCorrect;
              const showWrong = isSelected && !isCorrect;

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                  style={{
                    ...styles.option,
                    ...(showCorrect ? styles.optionCorrect : {}),
                    ...(showWrong ? styles.optionWrong : {}),
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={styles.nextBtnWrap}>
              <button onClick={handleNext} style={{ ...styles.btn, ...styles.btnPrimary }}>
                {current + 1 >= questions.length ? "See Results" : "Next Question"}
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
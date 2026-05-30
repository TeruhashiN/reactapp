import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./quiz.css";

type Question = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  options: string[];
  answer: string;
};

const QUESTIONS: Question[] = [
  {
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    meaning: "Hello",
    options: ["Goodbye", "Hello", "Thank you", "Sorry"],
    answer: "Hello",
  },
  {
    hanzi: "谢谢",
    pinyin: "xiè xiè",
    meaning: "Thank you",
    options: ["Please", "Sorry", "Thank you", "Welcome"],
    answer: "Thank you",
  },
  {
    hanzi: "再见",
    pinyin: "zài jiàn",
    meaning: "Goodbye",
    options: ["Hello", "Good morning", "Goodbye", "Good night"],
    answer: "Goodbye",
  },
  {
    hanzi: "我爱你",
    pinyin: "wǒ ài nǐ",
    meaning: "I love you",
    options: ["I miss you", "I love you", "I need you", "I like you"],
    answer: "I love you",
  },
  {
    hanzi: "水",
    pinyin: "shuǐ",
    meaning: "Water",
    options: ["Fire", "Earth", "Water", "Air"],
    answer: "Water",
  },
  {
    hanzi: "猫",
    pinyin: "māo",
    meaning: "Cat",
    options: ["Dog", "Bird", "Fish", "Cat"],
    answer: "Cat",
  },
  {
    hanzi: "太好了",
    pinyin: "tài hǎo le",
    meaning: "Excellent!",
    options: ["Not good", "Excellent!", "So-so", "Very bad"],
    answer: "Excellent!",
  },
  {
    hanzi: "朋友",
    pinyin: "péng yǒu",
    meaning: "Friend",
    options: ["Enemy", "Teacher", "Friend", "Family"],
    answer: "Friend",
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Quiz() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [questions] = useState(() => shuffle(QUESTIONS).slice(0, 6));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<
    { hanzi: string; chosen: string; correct: string; ok: boolean }[]
  >([]);

  async function handleLogin() {
    try {
      setLoginError("");

      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Login failed");
      }

      const data: { token: string } = await res.json();
      localStorage.setItem("token", data.token);
      setLoggedIn(true);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setLoggedIn(false);
      setLoginError(e?.message || "Invalid username or password.");
    }
  }

  function handleSelect(option: string) {
    if (selected) return;
    const q = questions[current];
    const ok = option === q.answer;
    setSelected(option);
    if (ok) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      { hanzi: q.hanzi, chosen: option, correct: q.answer, ok },
    ]);
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
  }

  const q = questions[current];
  const pct = Math.round((score / questions.length) * 100);

  if (!loggedIn) {
    return (
      <section className="quiz-section" id="quiz">
        <div className="quiz-shell">
          <div className="quiz-card" style={{ maxWidth: 560 }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 48, marginBottom: "0.5rem" }}>🀄</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>
                Chinese Student Quiz Section
              </h1>
              <p className="quiz-subtitle" style={{ margin: 0 }}>
                Sign in to test your English knowledge
              </p>
            </div>

            <div className="quiz-login-grid">
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="quiz-form-label">Username</label>
                <input
                  className="quiz-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter username"
                />
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="quiz-form-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="quiz-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Enter password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    onClick={() => setShowPassword((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b7280",
                      padding: 0,
                      fontSize: 16,
                    }}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    type="button"
                  >
                    <i
                      className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}
                    />
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="quiz-alert">
                  <i
                    className="ti ti-alert-circle"
                    style={{ marginRight: 6, verticalAlign: -2 }}
                    aria-hidden="true"
                  />
                  {loginError}
                </div>
              )}
              <button onClick={handleLogin} className="quiz-btn" type="button">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="quiz-section" id="quiz">
        <div className="quiz-shell">
          <div className="quiz-card" style={{ maxWidth: 560 }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 48, marginBottom: "0.5rem" }}>
                {pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📖"}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                Quiz complete!
              </h2>
              <p className="quiz-muted" style={{ margin: 0 }}>
                You scored <strong>{score}</strong> out of{" "}
                <strong>{questions.length}</strong> — {pct}%
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              {answers.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <i
                    className={`ti ${a.ok ? "ti-circle-check" : "ti-circle-x"}`}
                    style={{
                      color: a.ok ? "#166534" : "#991b1b",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: 20, minWidth: 48 }}>{a.hanzi}</span>
                  <span
                    className="quiz-muted"
                    style={{ fontSize: 13, flex: 1 }}
                  >
                    {a.ok ? (
                      a.correct
                    ) : (
                      <>
                        <span
                          style={{
                            color: "#991b1b",
                            textDecoration: "line-through",
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

            <div className="quiz-footer-actions">
              <button
                onClick={handleRestart}
                className="quiz-btn"
                type="button"
                style={{ width: "auto", flex: 1 }}
              >
                Try again
              </button>
              <button
                onClick={() => setLoggedIn(false)}
                className="quiz-btn quiz-btn--ghost"
                type="button"
                style={{ width: "auto", flex: 1 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-section" id="quiz">
      <div className="quiz-shell">
        <div className="quiz-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div className="quiz-title">
              <span style={{ fontSize: 20 }}>🀄</span>
              <span style={{ fontSize: 15 }}>Chinese Quiz</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="quiz-muted" style={{ fontSize: 13 }}>
                {current + 1} / {questions.length}
              </span>
              <button
                onClick={() => setLoggedIn(false)}
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="quiz-progress" aria-hidden="true">
            <div style={{ width: `${(current / questions.length) * 100}%` }} />
          </div>

          <p className="quiz-muted" style={{ fontSize: 13, margin: "0 0 6px" }}>
            What does this mean?
          </p>

          <div className="quiz-question" style={{ margin: "1.5rem 0" }}>
            <div className="hanzi">{q.hanzi}</div>
            <div className="pinyin">{q.pinyin}</div>
          </div>

          <div className="quiz-options">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === q.answer;
              const showCorrect = selected && isCorrect;
              const showWrong = isSelected && !isCorrect;

              const className = [
                "quiz-option",
                showCorrect ? "quiz-option--correct" : "",
                showWrong ? "quiz-option--wrong" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={!!selected}
                  className={className}
                  type="button"
                >
                  {showCorrect && (
                    <i
                      className="ti ti-check"
                      style={{ marginRight: 6 }}
                      aria-hidden="true"
                    />
                  )}
                  {showWrong && (
                    <i
                      className="ti ti-x"
                      style={{ marginRight: 6 }}
                      aria-hidden="true"
                    />
                  )}
                  {opt}
                </button>
              );
            })}
          </div>

          {selected && (
            <div style={{ marginTop: "1.25rem" }}>
              <button onClick={handleNext} className="quiz-btn" type="button">
                {current + 1 >= questions.length
                  ? "See results"
                  : "Next question"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

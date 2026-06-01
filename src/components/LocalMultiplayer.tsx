import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type QuizQuestion = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const TIME_OPTIONS = [
  { value: 0, label: "No timer" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
];
const PLAYER_OPTIONS = [2, 3, 4];

const getQuestionCountOptions = (numPlayers: number): number[] => {
  switch (numPlayers) {
    case 2:
      return [10, 20, 50, 100];
    case 3:
      return [15, 30, 60, 120];
    case 4:
      return [20, 40, 120, 200];
    default:
      return [10, 20, 50, 100];
  }
};

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
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // ignore audio errors
  }
}

function getPlayerColors(numPlayers: number) {
  const colors = [
    { bg: "#E8E4FF", text: "#3C3489", accent: "#E6E0FA" },
    { bg: "#FFE5D9", text: "#993C1D", accent: "#FFE5D9" },
    { bg: "#E1F5EE", text: "#085041", accent: "#E1F5EE" },
    { bg: "#FDE8EF", text: "#A32D6E", accent: "#FDE8EF" },
  ];
  return colors.slice(0, numPlayers);
}

export default function LocalMultiplayer() {
  const navigate = useNavigate();

  const [setup, setSetup] = useState({
    numPlayers: 2,
    timeLimit: 0,
    questionCount: 10,
  });
  const [gameStarted, setGameStarted] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [activePlayer, setActivePlayer] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeftPerPlayer, setTimeLeftPerPlayer] = useState<number[]>([]);
  const [playersOut, setPlayersOut] = useState<boolean[]>([]);
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerColors = getPlayerColors(setup.numPlayers);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const res = await fetch(
        `http://localhost:4000/api/timer-quiz/questions?count=${setup.questionCount}`,
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
      setScores(Array(setup.numPlayers).fill(0));
      // each player gets their own full timer (in seconds)
      setTimeLeftPerPlayer(Array(setup.numPlayers).fill(setup.timeLimit));
      setPlayersOut(Array(setup.numPlayers).fill(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [setup.questionCount, setup.numPlayers, setup.timeLimit]);

  useEffect(() => {
    if (!gameStarted) return;
    fetchQuestions();
  }, [fetchQuestions, gameStarted]);

  // Reset questionCount to first valid option when numPlayers changes
  useEffect(() => {
    const validOptions = getQuestionCountOptions(setup.numPlayers);
    if (!validOptions.includes(setup.questionCount)) {
      setSetup((prev) => ({
        ...prev,
        questionCount: validOptions[0],
      }));
    }
  }, [setup.numPlayers]);

  useEffect(() => {
    if (setup.timeLimit <= 0 || finished) return;

    // advance activePlayer to the next alive player
    const aliveIndex = (() => {
      if (!playersOut || playersOut.length === 0) return activePlayer;
      for (let step = 0; step < setup.numPlayers; step++) {
        const idx = (activePlayer + step) % setup.numPlayers;
        if (!playersOut[idx]) return idx;
      }
      return activePlayer;
    })();

    if (aliveIndex !== activePlayer) {
      setActivePlayer(aliveIndex);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeftPerPlayer((prev) => {
        const next = [...prev];
        const currentPlayer = aliveIndex;
        if (typeof next[currentPlayer] !== "number") return prev;
        if (playersOut?.[currentPlayer]) return prev;

        if (next[currentPlayer] <= 1) {
          next[currentPlayer] = 0;
          return next;
        }

        next[currentPlayer] = next[currentPlayer] - 1;
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setup.timeLimit, finished, activePlayer, playersOut]);

  // If any player's timer reaches 0, mark them out (but keep playing)
  useEffect(() => {
    if (setup.timeLimit <= 0 || finished) return;

    const nextOut = [...playersOut];
    let changed = false;

    for (let i = 0; i < timeLeftPerPlayer.length; i++) {
      if (!nextOut[i] && (timeLeftPerPlayer[i] ?? 0) <= 0) {
        nextOut[i] = true;
        changed = true;
      }
    }

    if (changed) {
      setPlayersOut(nextOut);
    }
  }, [timeLeftPerPlayer, setup.timeLimit, finished, playersOut]);

  // End the match only when all but 1 players are out
  useEffect(() => {
    if (setup.timeLimit <= 0 || finished) return;
    const alive = playersOut.filter((x) => !x).length;
    if (alive <= 1) setFinished(true);
  }, [playersOut, setup.timeLimit, finished]);

  function handleSelect(opt: string) {
    if (!questions[current] || finished) return;
    const q = questions[current];
    const chosenText = opt.replace(/^[A-D]\. /, "");

    const ok = chosenText === q.answer;
    setSelected(opt);

    playTone(ok ? 600 : 300, ok ? 80 : 150);

    const newScores = [...scores];
    if (ok) newScores[activePlayer] = scores[activePlayer] + 1;
    setScores(newScores);

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setActivePlayer((p) => {
          // skip out players
          for (let step = 1; step <= setup.numPlayers; step++) {
            const idx = (p + step) % setup.numPlayers;
            if (!playersOut?.[idx]) return idx;
          }
          return p;
        });
      }
    }, 350);
  }

  function startGame() {
    setGameStarted(true);
    setActivePlayer(0);
    setCurrent(0);
    setSelected(null);
    setFinished(false);
    setPlayersOut(Array(setup.numPlayers).fill(false));
  }

  function handleRestart() {
    playTone(400, 120);
    setFinished(false);
    setCurrent(0);
    setSelected(null);
    setScores(Array(setup.numPlayers).fill(0));
    setActivePlayer(0);
    setTimeLeftPerPlayer(Array(setup.numPlayers).fill(setup.timeLimit));
    setPlayersOut(Array(setup.numPlayers).fill(false));

    if (timerRef.current) clearInterval(timerRef.current);

    fetchQuestions();
  }

  function goBack() {
    if (gameStarted) {
      setGameStarted(false);
      setQuestions([]);
    } else {
      navigate("/dashboard");
    }
  }

  if (!gameStarted) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.header}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={s.backBtn}
            >
              ← Dashboard
            </button>
            <h2 style={{ ...s.cardTitle, margin: "12px 0 4px" }}>
              👥 Local Multiplayer
            </h2>
            <p style={s.cardSub}>
              Configure your local multiplayer quiz battle
            </p>
          </div>

          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 4 }}>
              1. Number of Players
            </h3>
            <p style={{ ...s.cardSub, marginBottom: 12 }}>
              Choose between 2 to 4 players
            </p>
            <div style={countGridStyle}>
              {PLAYER_OPTIONS.map((n) => {
                const isActive = setup.numPlayers === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSetup({ ...setup, numPlayers: n })}
                    style={{
                      ...countBtn,
                      ...(isActive ? countBtnActive : countBtnDefault),
                    }}
                  >
                    {n} {n === 1 ? "Player" : "Players"}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 4 }}>
              2. Number of Questions
            </h3>
            <p style={{ ...s.cardSub, marginBottom: 12 }}>
              Choose how many questions you want to play
            </p>
            <div style={countGridStyle}>
              {getQuestionCountOptions(setup.numPlayers).map((n) => {
                const isActive = setup.questionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSetup({ ...setup, questionCount: n })}
                    style={{
                      ...countBtn,
                      ...(isActive ? countBtnActive : countBtnDefault),
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: 4 }}>3. Time Limit</h3>
            <p style={{ ...s.cardSub, marginBottom: 12 }}>
              Set a timer or play without time pressure
            </p>
            <div style={countGridStyle}>
              {TIME_OPTIONS.map((opt) => {
                const isActive = setup.timeLimit === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSetup({ ...setup, timeLimit: opt.value })}
                    style={{
                      ...countBtn,
                      ...(isActive ? countBtnActive : countBtnDefault),
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={startGame}
            style={{ ...s.startBtn, marginTop: 8 }}
          >
            🎮 Start Game
          </button>
        </div>
      </div>
    );
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
              <p
                style={{
                  color: "#A32D2D",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                {error || "No questions available."}
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <button
                  onClick={() => navigate("/local-multiplayer")}
                  style={{ ...s.btn, ...s.btnPrimary }}
                >
                  Back to Setup
                </button>
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
      </div>
    );
  }

  if (finished) {
    const alivePlayers = scores
      .map((score, idx) => ({ score, idx }))
      .filter((p) => !playersOut?.[p.idx]);

    const maxScore = Math.max(...alivePlayers.map((p) => p.score));
    const winners = alivePlayers
      .filter((p) => p.score === maxScore)
      .map((p) => `Player ${p.idx + 1}`);

    const winnerText =
      winners.length === 1
        ? `${winners[0]} wins!`
        : alivePlayers.length === winners.length
          ? "Draw!"
          : `${winners.join(", ")} tie!`;

    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.card}>
            <div style={s.cardBody}>
              <h2 style={s.resultTitle}>Game Over!</h2>
              <div
                style={{
                  ...s.scoresGrid,
                  gridTemplateColumns: `repeat(${setup.numPlayers}, 1fr)`,
                }}
              >
                {scores.map((score, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...s.scoreBox,
                      background: playerColors[idx].bg,
                      color: playerColors[idx].text,
                      opacity: playersOut?.[idx] ? 0.45 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Player {idx + 1}
                      {playersOut?.[idx] ? " (Out)" : ""}
                    </div>
                    <div style={{ fontSize: 24 }}>{score}</div>
                  </div>
                ))}
              </div>

              <p
                style={{ textAlign: "center", fontSize: 18, margin: "16px 0" }}
              >
                {winnerText}
              </p>
              <div
                style={{ display: "flex", gap: 10, flexDirection: "column" }}
              >
                <button
                  onClick={handleRestart}
                  style={{ ...s.btn, ...s.btnPrimary }}
                >
                  ↺ Play Again
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

  const q = questions[current];

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.cardBody}>
            <div style={s.quizHeader}>
              <button onClick={goBack} style={s.backBtn}>
                ← Back
              </button>
              <span style={s.levelBadge}>Local Multiplayer</span>
              <span style={s.qCounter}>
                Q {current + 1} / {questions.length}
              </span>
            </div>

            {setup.timeLimit > 0 && (
              <div style={s.timerDisplay}>
                <span
                  style={{
                    ...s.timerBig,
                    color:
                      (timeLeftPerPlayer[activePlayer] ?? 0) <= 10
                        ? "#E24B4A"
                        : "#2C2C2A",
                  }}
                >
                  {Math.floor((timeLeftPerPlayer[activePlayer] ?? 0) / 60)}:
                  {String((timeLeftPerPlayer[activePlayer] ?? 0) % 60).padStart(
                    2,
                    "0",
                  )}
                </span>

                <span style={s.timerLabel}>remaining</span>
              </div>
            )}

            <div style={s.activePlayerBanner}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: playerColors[activePlayer].text,
                  background: playerColors[activePlayer].accent,
                  padding: "6px 12px",
                  borderRadius: 20,
                }}
              >
                👤 Player {activePlayer + 1}'s Turn
              </span>
            </div>

            <div
              style={{
                ...s.scoresGrid,
                gridTemplateColumns: `repeat(${setup.numPlayers}, 1fr)`,
              }}
            >
              {scores.map((score, idx) => (
                <div
                  key={idx}
                  style={{
                    ...s.scoreBox,
                    background: playerColors[idx].bg,
                    opacity: activePlayer === idx ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>P{idx + 1}</div>
                  <div style={{ fontSize: 20 }}>{score}</div>
                </div>
              ))}
            </div>

            <p style={s.questionLabel}>What does this word mean?</p>
            <h3 style={s.questionText}>"{q.word}"</h3>

            <div style={s.optionsGrid}>
              {q.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    ...s.optionBtn,
                    ...(selected === opt
                      ? {
                          background: playerColors[activePlayer].bg,
                          borderColor: playerColors[activePlayer].text,
                          color: playerColors[activePlayer].text,
                        }
                      : {}),
                  }}
                >
                  <span
                    style={{
                      ...s.optLetter,
                      ...(selected === opt
                        ? {
                            background: playerColors[activePlayer].text,
                            borderColor: playerColors[activePlayer].text,
                            color: playerColors[activePlayer].bg,
                          }
                        : {}),
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

const countGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
};

const countBtn: React.CSSProperties = {
  borderRadius: 8,
  padding: "0.75rem 0.5rem",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  border: "0.5px solid",
  transition: "background 0.15s, transform 0.1s",
  width: "100%",
  fontFamily: "inherit",
};

const countBtnDefault: React.CSSProperties = {
  background: "#fff",
  borderColor: "#B4B2A9",
  color: "#2C2C2A",
};
const countBtnActive: React.CSSProperties = {
  background: "#E6E0FA",
  borderColor: "#3C3489",
  color: "#3C3489",
};

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
  header: {
    background: "#fff",
    border: "0.5px solid #D3D1C7",
    borderRadius: 12,
    padding: "1.25rem",
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
  cardBody: {
    padding: "1.5rem",
  },
  quizHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
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
  timerDisplay: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginBottom: "1rem",
  },
  timerBig: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32,
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
  activePlayerBanner: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  scoresGrid: {
    display: "grid",
    gap: 10,
    marginBottom: "1.25rem",
  },
  scoreBox: {
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
    fontFamily: "inherit",
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

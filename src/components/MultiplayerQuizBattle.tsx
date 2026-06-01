import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Question = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

const API_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "http://localhost:4000";
const API = `${API_BASE}/api`;
const COUNT_OPTIONS = [5, 10, 20] as const;

const STORAGE_KEY = "__multiplayer_battle_state";

type BattleStatus = "idle" | "waiting" | "in_progress" | "finished";

type BattleState = {
  challengerId: number;
  opponentId: number | null;
  questionCount: number;
  questions: Question[];
  challengerScore: number;
  opponentScore: number;
  challengerCurrentQ: number;
  opponentCurrentQ: number;
  challengerFinished: boolean;
  opponentFinished: boolean;
  opponentUsername: string | null;
  startTime: string | null;
};

function makeEmptyState(): BattleState {
  return {
    challengerId: 0,
    opponentId: null,
    questionCount: 10,
    questions: [],
    challengerScore: 0,
    opponentScore: 0,
    challengerCurrentQ: 0,
    opponentCurrentQ: 0,
    challengerFinished: false,
    opponentFinished: false,
    opponentUsername: null,
    startTime: null,
  };
}

function readBattleState(): BattleState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BattleState;
  } catch {
    return null;
  }
}

function writeBattleState(state: BattleState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearBattleState() {
  localStorage.removeItem(STORAGE_KEY);
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, data: text };
  }
}

export default function MultiplayerQuizBattle() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<{ user_id: number; username: string; score: number }[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [meUsername, setMeUsername] = useState<string>("You");

  const [opponentId, setOpponentId] = useState<number | null>(null);
  const [opponentUsername, setOpponentUsername] = useState<string>("");
  const [count, setCount] = useState<number>(10);

  const [status, setStatus] = useState<BattleStatus>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [finished, setFinished] = useState(false);
  const [battleResult, setBattleResult] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const [meRes, lbRes] = await Promise.all([
          fetch(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/leaderboard?limit=20`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!meRes.ok) throw new Error("Failed to fetch current user");
        const meData = await safeJson(meRes);
        if (!meData.ok || !meData.data?.user?.user_id) throw new Error("Invalid current user response");
        setMeId(meData.data.user.user_id);
        setMeUsername(meData.data.user.username || "You");

        if (!lbRes.ok) throw new Error("Failed to fetch players");
        const lbData = await safeJson(lbRes);
        if (!lbData.ok || !lbData.data?.users) throw new Error("Invalid players response");
        setPlayers(lbData.data.users);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load players");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [token]);

  const opponentPlayers = meId ? players.filter((p) => p.user_id !== meId) : players;
  const selectedOpponent = players.find((p) => p.user_id === opponentId);

  const updateLocalBattle = (state: BattleState) => {
    setOpponentScore(state.opponentScore);
    setCurrent(state.challengerCurrentQ);
    setScore(state.challengerScore);
    if (state.opponentFinished) {
      setFinished(true);
    }
  };

  const startBattle = async () => {
    if (!opponentId || !meId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ count: String(count) });
      const res = await fetch(`${API}/timer-quiz/questions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await safeJson(res);
      if (!data.ok || !data.data?.questions) throw new Error("Invalid questions response");

      const qs: Question[] = data.data.questions.map((q: any) => ({
        id: q.id,
        word: q.word,
        options: q.options,
        answer: q.answer,
      }));

      const battleState: BattleState = {
        challengerId: meId,
        opponentId,
        questionCount: count,
        questions: qs,
        challengerScore: 0,
        opponentScore: 0,
        challengerCurrentQ: 0,
        opponentCurrentQ: 0,
        challengerFinished: false,
        opponentFinished: false,
        opponentUsername: selectedOpponent?.username ?? null,
        startTime: new Date().toISOString(),
      };

      writeBattleState(battleState);

      setQuestions(qs);
      setCurrent(0);
      setScore(0);
      setOpponentScore(0);
      setSelectedAnswer(null);
      setResult(null);
      setFinished(false);
      setBattleResult(null);
      setStatus("waiting");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  const markMeWaiting = () => {
    const existing = readBattleState();
    if (!existing || !meId) return;
    const updated: BattleState = {
      ...existing,
      challengerScore: existing.challengerId === meId ? existing.challengerScore : existing.opponentScore,
      opponentScore: existing.challengerId === meId ? existing.opponentScore : existing.challengerScore,
      challengerCurrentQ: existing.challengerId === meId ? existing.challengerCurrentQ : existing.opponentCurrentQ,
      opponentCurrentQ: existing.challengerId === meId ? existing.opponentCurrentQ : existing.challengerCurrentQ,
      challengerFinished: existing.challengerId === meId ? existing.challengerFinished : existing.opponentFinished,
      opponentFinished: existing.challengerId === meId ? existing.opponentFinished : existing.challengerFinished,
    };
    writeBattleState(updated);
    setStatus("in_progress");
  };

  useEffect(() => {
    if (status !== "in_progress" && status !== "waiting") {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = 0;
      return;
    }

    const poll = async () => {
      const state = readBattleState();
      if (!state || !meId) return;

      const iAmChallenger = state.challengerId === meId;
      const myCurrent = iAmChallenger ? state.challengerCurrentQ : state.opponentCurrentQ;
      const myFinished = iAmChallenger ? state.challengerFinished : state.opponentFinished;
      const opponentFinished = iAmChallenger ? state.opponentFinished : state.challengerFinished;
      const opponentScoreRaw = iAmChallenger ? state.opponentScore : state.challengerScore;

      setCurrent(myCurrent);
      setScore(iAmChallenger ? state.challengerScore : state.opponentScore);
      setOpponentScore(opponentScoreRaw);

      if (status === "waiting" && state.opponentId && state.opponentId !== state.challengerId) {
        const opponentInfo = players.find((p) => p.user_id === state.opponentId);
        if (opponentInfo) setOpponentUsername(opponentInfo.username);
        if (state.opponentId !== null && state.opponentId !== state.challengerId) {
          setStatus("in_progress");
        }
      }

      if (opponentFinished && !finished) {
        setFinished(true);
      }

      if (myFinished && opponentFinished && !battleResult) {
        const myTotal = iAmChallenger ? state.challengerScore : state.opponentScore;
        const oppTotal = opponentScoreRaw;
        const resultMsg = myTotal > oppTotal ? "🏆 Victory!" : myTotal < oppTotal ? "💥 Defeated" : "🤝 Draw!";
        setBattleResult(resultMsg);
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, 1000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (status === "in_progress" || status === "waiting")) {
        poll();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = 0;
      window.removeEventListener("storage", onStorage);
    };
  }, [status, meId, meUsername, finished, battleResult, players]);

  const handleAnswer = (opt: string) => {
    if (result !== null) return;
    if (finished) return;
    const currentQ = questions[current];
    if (!currentQ) return;
    const chosenText = opt.replace(/^[A-D]\. /, "");
    const ok = chosenText === currentQ.answer;
    setSelectedAnswer(opt);
    setScore((s) => s + (ok ? 1 : 0));
    setResult(ok ? "correct" : "wrong");

    const state = readBattleState();
    if (!state || !meId) return;
    const iAmChallenger = state.challengerId === meId;
    const nextIndex = current + 1;
    const done = nextIndex >= questions.length;
    const newScore = (iAmChallenger ? state.challengerScore : state.opponentScore) + (ok ? 1 : 0);

    const updated: BattleState = {
      ...state,
      challengerScore: iAmChallenger ? newScore : state.challengerScore,
      opponentScore: iAmChallenger ? state.opponentScore : newScore,
      challengerCurrentQ: iAmChallenger ? nextIndex : state.challengerCurrentQ,
      opponentCurrentQ: iAmChallenger ? state.opponentCurrentQ : nextIndex,
      challengerFinished: iAmChallenger ? done : state.challengerFinished,
      opponentFinished: iAmChallenger ? state.opponentFinished : done,
    };

    writeBattleState(updated);

    if (done && !battleResult) {
      setFinished(true);
      setTimeout(() => {
        const fresh = readBattleState();
        if (!fresh) return;
        const myTotal = iAmChallenger ? fresh.challengerScore : fresh.opponentScore;
        const oppTotal = iAmChallenger ? fresh.opponentScore : fresh.challengerScore;
        setBattleResult(myTotal > oppTotal ? "🏆 Victory!" : myTotal < oppTotal ? "💥 Defeated" : "🤝 Draw!");
      }, 300);
    }
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      setResult(null);
      setSelectedAnswer(null);
      setCurrent((c) => c + 1);
    } else {
      setCurrent((c) => c + 1);
      setSelectedAnswer(null);
      setResult(null);
    }
  };

  const leaveBattle = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = 0;
    setStatus("idle");
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setOpponentScore(0);
    setFinished(false);
    setBattleResult(null);
    setSelectedAnswer(null);
    setResult(null);
    setOpponentId(null);
    setOpponentUsername("");
    clearBattleState();
  };

  if (status === "waiting") {
    const displayOpponent = opponentUsername || selectedOpponent?.username || "Opponent";
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 8 }}>⏳ Waiting for opponent...</h2>
            <p style={{ ...styles.cardSub, marginBottom: 12 }}>
              Ask <b>{displayOpponent}</b> to open this same page on another tab/device and pick you as the opponent to start the battle.
            </p>
            <div style={styles.liveScores}>
              <div style={{ ...styles.scoreBox, background: "#EEEDFE", color: "#3C3489" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Challenger</div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{meUsername}</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{0}</div>
              </div>
              <div style={{ ...styles.scoreBox, background: "#FAECE7", color: "#993C1D" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Opponent</div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{displayOpponent}</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{0}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button type="button" onClick={leaveBattle} style={{ ...styles.secondaryBtn, flex: 1 }}>
                Cancel
              </button>
              <button type="button" onClick={markMeWaiting} style={{ ...styles.startBtn, flex: 1 }}>
                Start Anyway (practice)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "in_progress" && questions.length > 0 && !finished && !battleResult) {
    const q = questions[current];
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.progressInfo}>
              <span>
                Q {current + 1} / {questions.length}
              </span>
              <span style={{ fontWeight: 500 }}>
                Versus {opponentUsername || selectedOpponent?.username || "Opponent"}
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

            <div style={styles.liveScores}>
              <div style={{ ...styles.scoreBox, background: "#EEEDFE", color: "#3C3489" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>You ({meUsername})</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{score}</div>
                <div style={{ fontSize: 11, color: "#3C3489" }}>
                  Q {current + 1}
                </div>
              </div>
              <div style={{ ...styles.scoreBox, background: "#FAECE7", color: "#993C1D" }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {opponentUsername || selectedOpponent?.username || "Opponent"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{opponentScore}</div>
                <div style={{ fontSize: 11, color: "#993C1D" }}>
                  Q {opponentScore !== undefined ? Math.min(opponentScore, questions.length) : 0}
                </div>
              </div>
            </div>

            <div style={styles.questionBlock}>
              <p style={{ ...styles.cardSub, marginBottom: 6, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                What does this word mean?
              </p>
              <h3 style={{ ...styles.cardTitle, marginBottom: 16, fontSize: 18, textAlign: "center", fontStyle: "italic" }}>
                “{q.word}”
              </h3>
              <div style={optionsGridStyle}>
                {q.options.map((opt, idx) => {
                  const letter = OPTION_LETTERS[idx];
                  const plain = opt.replace(/^[A-D]\. /, "");
                  let btnStyle: React.CSSProperties = optionBtnBase;
                  if (result && opt === selectedAnswer) {
                    btnStyle = result === "correct" ? optionBtnCorrect : optionBtnWrong;
                  } else if (result && result === "wrong" && plain === q.answer) {
                    btnStyle = optionBtnReveal;
                  }
                  const isChosen = selectedAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswer(opt)}
                      disabled={result !== null}
                      style={btnStyle}
                    >
                      <span
                        style={{
                          ...optLetter,
                          ...(isChosen ? optLetterSelected : {}),
                        }}
                      >
                        {letter}
                      </span>
                      <span>{plain}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {result !== null && (
              <div style={resultBarStyle}>
                <span
                  style={{
                    color: result === "correct" ? "#085041" : "#993C1D",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  {result === "correct" ? "✅ Correct!" : `❌ Wrong! Answer: ${q.answer}`}
                </span>
                <button type="button" onClick={nextQuestion} style={nextBtnStyle}>
                  {current + 1 >= questions.length - 1 ? "Finish" : "Next →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if ((finished || battleResult || (status === "in_progress" && questions.length > 0)) && battleResult) {
    const total = questions.length || count;
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, fontSize: 18, marginBottom: 8 }}>{battleResult}</h2>
            <p style={{ ...styles.cardSub, marginBottom: 20 }}>
              You: {score} — Opponent: {opponentScore}
            </p>
            <div style={optionsGridStyle}>
              <div style={{ ...scoreBoxStyle, background: "#EEEDFE", color: "#3C3489" }}>
                <div style={{ fontWeight: 600 }}>You</div>
                <div style={{ fontSize: 20 }}>{score}</div>
              </div>
              <div style={{ ...scoreBoxStyle, background: "#FAECE7", color: "#993C1D" }}>
                <div style={{ fontWeight: 600 }}>{opponentUsername || "Opponent"}</div>
                <div style={{ fontSize: 20 }}>{opponentScore}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="button" onClick={leaveBattle} style={{ ...styles.startBtn, flex: 1 }}>
                Play Again
              </button>
              <button type="button" onClick={() => navigate("/dashboard")} style={{ ...styles.secondaryBtn, flex: 1 }}>
                Dashboard
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
          <h2 style={{ ...styles.cardTitle, margin: "12px 0 4px" }}>⚔️ Multiplayer Quiz Battle</h2>
          <p style={styles.cardSub}>
            Challenge another player from the leaderboard and battle head-to-head in real time.
          </p>
          {error && <p style={styles.errorText}>Error: {error}</p>}
        </div>

        <div style={styles.card}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>1. Choose Active Player</h3>
          <p style={{ ...styles.cardSub, marginBottom: 12 }}>
            Select a player to challenge. Your score updates will be shown live to them and theirs to you.
          </p>

          {fetching ? (
            <p style={styles.loadingText}>Loading players…</p>
          ) : opponentPlayers.length === 0 ? (
            <p style={styles.loadingText}>No players available.</p>
          ) : (
            <div style={playerGridStyle}>
              {opponentPlayers.map((p) => {
                const isSelected = opponentId === p.user_id;
                const initials = p.username
                  .split(/[\s_-]+/)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .slice(0, 2)
                  .join("");
                return (
                  <button
                    key={p.user_id}
                    type="button"
                    onClick={() => {
                      setOpponentId(p.user_id);
                      setOpponentUsername(p.username);
                    }}
                    style={{
                      ...playerCard,
                      ...(isSelected ? playerCardActive : playerCardDefault),
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
                      </div>
                      <div style={{ fontSize: 12, color: "#888780" }}>Score: {p.score}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {opponentId && (
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>2. How many questions?</h3>
            <p style={{ ...styles.cardSub, marginBottom: 12 }}>
              Choose how many questions you want in this battle.
            </p>
            <div style={countGridStyle}>
              {COUNT_OPTIONS.map((n) => {
                const isActive = count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
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
            <button
              type="button"
              onClick={startBattle}
              disabled={loading}
              style={{
                ...styles.startBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
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

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const playerGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const playerCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "0.5px solid",
  borderRadius: 10,
  padding: "0.85rem 1rem",
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  background: "#fff",
};

const playerCardDefault: React.CSSProperties = { borderColor: "#D3D1C7" };
const playerCardActive: React.CSSProperties = { borderColor: "#3C3489", background: "#F8F7FF" };

const countGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginBottom: 16,
};

const countBtn: React.CSSProperties = {
  borderRadius: 8,
  padding: "0.75rem 0.5rem",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
  border: "0.5px solid",
  transition: "background 0.15s, transform 0.1s",
  width: "100%",
  fontFamily: "inherit",
};

const countBtnDefault: React.CSSProperties = { background: "#fff", borderColor: "#B4B2A9", color: "#2C2C2A" };
const countBtnActive: React.CSSProperties = { background: "#EEEDFE", borderColor: "#3C3489", color: "#3C3489" };

const optionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 8,
};

const optionBtnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "0.8rem 1rem",
  background: "#fff",
  border: "0.5px solid #D3D1C7",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: 400,
  color: "#2C2C2A",
  textAlign: "left",
  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
};

const optionBtnCorrect: React.CSSProperties = {
  background: "#E1F5EE",
  borderColor: "#5DCAA5",
  color: "#085041",
  transform: "scale(1.01)",
};

const optionBtnWrong: React.CSSProperties = {
  background: "#FAECE7",
  borderColor: "#F0997B",
  color: "#993C1D",
};

const optionBtnReveal: React.CSSProperties = {
  background: "#fff",
  borderColor: "#B4B2A9",
  color: "#2C2C2A",
};

const optLetter: React.CSSProperties = {
  width: 22,
  height: 22,
  flexShrink: 0,
  borderRadius: "50%",
  border: "1px solid #D3D1C7",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 600,
  color: "#5F5E5A",
  marginTop: 1,
  transition: "all 0.15s",
};

const optLetterSelected: React.CSSProperties = {
  background: "#3C3489",
  borderColor: "#3C3489",
  color: "#fff",
};

const nextBtnStyle: React.CSSProperties = {
  border: "0.5px solid #3C3489",
  borderRadius: 8,
  background: "#EEEDFE",
  color: "#3C3489",
  padding: "0.55rem 1rem",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};

const resultBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 16,
  padding: "10px 14px",
  borderRadius: 10,
  background: "#F1EFE8",
  fontFamily: "inherit",
};

const scoreBoxStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: 10,
  padding: "0.85rem",
  textAlign: "center",
  fontSize: 13,
  fontFamily: "inherit",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f4f0",
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
    textAlign: "left",
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
    fontFamily: "inherit",
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
    fontFamily: "inherit",
  },
  liveScores: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  scoreBox: {
    borderRadius: 12,
    padding: "1rem",
    textAlign: "center",
    fontFamily: "inherit",
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
  loadingText: {
    color: "#888780",
    fontSize: 14,
    padding: "8px 0",
  },
  errorText: {
    color: "#A32D2D",
    fontSize: 13,
    marginTop: 8,
  },
  questionBlock: {
    marginTop: 8,
  },
};

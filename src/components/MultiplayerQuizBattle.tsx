import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Question = {
  id: number;
  word: string;
  options: string[];
  answer: string;
};

const API = "/api";
const COUNT_OPTIONS = [5, 10, 20] as const;

type BattleStatus = "idle" | "waiting" | "in_progress" | "finished";

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

  const [players, setPlayers] = useState<
    { user_id: number; username: string; score: number }[]
  >([]);
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
  const [iFinished, setIFinished] = useState(false);
  const [battleResult, setBattleResult] = useState<string | null>(null);

  const [battleId, setBattleId] = useState<number | null>(null);
  const [challenges, setChallenges] = useState<
    Array<{
      battle_id: number;
      challenger_id: number;
      challenger_username: string;
      question_count: number;
      created_at: string;
    }>
  >([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const [meRes, lbRes, challengesRes] = await Promise.all([
          fetch(`${API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/leaderboard?limit=20`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/battle/pending`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!meRes.ok) throw new Error("Failed to fetch current user");
        const meData = await safeJson(meRes);
        if (!meData.ok || !meData.data?.user?.user_id)
          throw new Error("Invalid current user response");
        setMeId(meData.data.user.user_id);
        setMeUsername(meData.data.user.username || "You");

        if (!lbRes.ok) throw new Error("Failed to fetch players");
        const lbData = await safeJson(lbRes);
        if (!lbData.ok || !lbData.data?.users)
          throw new Error("Invalid players response");
        setPlayers(lbData.data.users);

        if (challengesRes.ok) {
          const challengesData = await safeJson(challengesRes);
          if (
            challengesData.ok &&
            Array.isArray(challengesData.data?.battles)
          ) {
            setChallenges(challengesData.data.battles);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load players");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [token]);

  const opponentPlayers = meId
    ? players.filter((p) => p.user_id !== meId)
    : players;
  const selectedOpponent = players.find((p) => p.user_id === opponentId);

  const startBattle = async () => {
    if (!opponentId || !meId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ count: String(count) });
      const res = await fetch(
        `${API}/timer-quiz/questions?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await safeJson(res);
      if (!data.ok || !data.data?.questions)
        throw new Error("Invalid questions response");

      const qs: Question[] = (data.data.questions as unknown[]).map(
        (q: unknown) => {
          const qq = q as {
            id: number;
            word: string;
            options: string[];
            answer: string;
          };
          return {
            id: qq.id,
            word: qq.word,
            options: qq.options,
            answer: qq.answer,
          };
        },
      );

      const createRes = await fetch(`${API}/battle/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opponent_id: opponentId,
          question_count: count,
          questions: qs,
        }),
      });

      if (!createRes.ok) {
        const raw = await createRes.text().catch(() => "");
        throw new Error(raw || `Failed to create battle (${createRes.status})`);
      }

      const createData = await safeJson(createRes);
      if (!createData.ok || !createData.data?.battle_id)
        throw new Error("Failed to create battle");

      setBattleId(Number(createData.data.battle_id));
      setQuestions(qs);
      setCurrent(0);
      setScore(0);
      setOpponentScore(0);
      setOpponentUsername(selectedOpponent?.username ?? "");
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

  const [joiningBattleId, setJoiningBattleId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinBattle = async (battleIdToJoin: number) => {
    if (!token) return;
    if (joiningBattleId === battleIdToJoin) return;

    setJoinError(null);
    setJoiningBattleId(battleIdToJoin);

    try {
      const res = await fetch(`${API}/battle/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ battle_id: battleIdToJoin }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (text.includes("Already joined")) {
          setBattleId(battleIdToJoin);
          setStatus("in_progress");
          return;
        }
        throw new Error(text || `Join failed (${res.status})`);
      }

      setBattleId(battleIdToJoin);
      setStatus("in_progress");
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Failed to join battle");
    } finally {
      setJoiningBattleId(null);
    }
  };

  useEffect(() => {
    if (status !== "in_progress" && status !== "waiting") {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = 0;
      return;
    }

    const poll = async () => {
      if (!battleId || !meId || !token) return;
      try {
        const res = await fetch(`${API}/battle/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await safeJson(res);
        if (!data.ok || !data.data) return;

        const st = data.data.battle as {
          challenger_id: number;
          opponent_id: number | null;
          challenger_score: number;
          opponent_score: number;
          challenger_current_q: number;
          opponent_current_q: number;
          challenger_finished: number;
          opponent_finished: number;
          status: "waiting" | "in_progress" | "completed";
          questions: Question[];
        };

        const iAmChallenger = st.challenger_id === meId;

        if (Array.isArray(st.questions) && st.questions.length) {
          setQuestions(st.questions);
        }

        const myCurrent = iAmChallenger
          ? st.challenger_current_q
          : st.opponent_current_q;
        const myFinished = iAmChallenger
          ? st.challenger_finished === 1
          : st.opponent_finished === 1;
        const opponentFinished = iAmChallenger
          ? st.opponent_finished === 1
          : st.challenger_finished === 1;

        const opponentScoreRaw = iAmChallenger
          ? st.opponent_score
          : st.challenger_score;

        setCurrent(myCurrent);
        setScore(iAmChallenger ? st.challenger_score : st.opponent_score);
        setOpponentScore(opponentScoreRaw);

        if (st.status === "in_progress") {
          setStatus("in_progress");
        }

        if (myFinished) setIFinished(true);

        if (myFinished && opponentFinished && !battleResult) {
          const myTotal = iAmChallenger
            ? st.challenger_score
            : st.opponent_score;
          const oppTotal = opponentScoreRaw;
          const resultMsg =
            myTotal > oppTotal
              ? "🏆 Victory!"
              : myTotal < oppTotal
                ? "💥 Defeated"
                : "🤝 Draw!";
          setBattleResult(resultMsg);
        } else if (opponentFinished && !myFinished && !iFinished) {
          setBattleResult(null);
        }

        if (opponentFinished && !finished) setFinished(true);
      } catch {
        // ignore poll errors
      }
    };

    poll();
    pollRef.current = window.setInterval(poll, 1000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = 0;
    };
  }, [
    status,
    meId,
    meUsername,
    finished,
    battleResult,
    players,
    battleId,
    token,
  ]);

  const handleAnswer = (opt: string) => {
    if (result !== null) return;
    if (finished) return;
    const currentQ = questions[current];
    if (!currentQ) return;

    const chosenText = opt.replace(/^[A-D]\. /, "");
    const ok = chosenText === currentQ.answer;

    setSelectedAnswer(opt);
    setResult(ok ? "correct" : "wrong");

    void submitAnswer(ok);
  };

  const submitAnswer = async (isCorrect: boolean) => {
    if (!battleId || !token) return;

    const questionIndex = current;
    const done = questionIndex + 1 >= questions.length;

    try {
      const res = await fetch(`${API}/battle/answer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          battle_id: battleId,
          question_index: questionIndex,
          is_correct: isCorrect,
          finished: done,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Answer failed (${res.status})`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
    }
  };

  const nextQuestion = () => {
    setResult(null);
    setSelectedAnswer(null);
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
    setBattleId(null);
  };

  // ─── Waiting screen ───────────────────────────────────────────────────────
  if (status === "waiting") {
    const displayOpponent =
      opponentUsername || selectedOpponent?.username || "Opponent";
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 8 }}>
              ⏳ Waiting for opponent...
            </h2>
            <p style={{ ...styles.cardSub, marginBottom: 12 }}>
              Ask <b>{displayOpponent}</b> to open this same page on another
              tab/device and pick you as the opponent to start the battle.
            </p>
            <div style={styles.liveScores}>
              <div
                style={{
                  ...styles.scoreBox,
                  background: "#EEEDFE",
                  color: "#3C3489",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Challenger
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  {meUsername}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{0}</div>
              </div>
              <div
                style={{
                  ...styles.scoreBox,
                  background: "#FAECE7",
                  color: "#993C1D",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Opponent
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  {displayOpponent}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{0}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={leaveBattle}
                style={{ ...styles.secondaryBtn, flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ ...styles.startBtn, flex: 1 }}
                disabled
              >
                Waiting (practice disabled)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── In-progress screen ───────────────────────────────────────────────────
  if (
    status === "in_progress" &&
    questions.length > 0 &&
    !finished &&
    !battleResult
  ) {
    const q = questions[current] || questions[0];
    const showWaiting = iFinished;
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            {showWaiting ? (
              <>
                <h2
                  style={{
                    ...styles.cardTitle,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  ⏳ Waiting for opponent to finish...
                </h2>
                <p
                  style={{
                    ...styles.cardSub,
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  You've answered all questions. Your final score:
                </p>

                <div style={styles.liveScores}>
                  <div
                    style={{
                      ...styles.scoreBox,
                      background: "#EEEDFE",
                      color: "#3C3489",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      You ({meUsername})
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 600 }}>{score}</div>
                    <div style={{ fontSize: 12, color: "#3C3489" }}>
                      / {questions.length}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.scoreBox,
                      background: "#FAECE7",
                      color: "#993C1D",
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {opponentUsername ||
                        selectedOpponent?.username ||
                        "Opponent"}
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 600 }}>
                      {opponentScore}/{questions.length}
                    </div>
                    <div style={{ fontSize: 11, color: "#993C1D" }}>
                      playing...
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={styles.progressInfo}>
                  <span>
                    Q {current + 1} / {questions.length}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    Versus{" "}
                    {opponentUsername ||
                      selectedOpponent?.username ||
                      "Opponent"}
                  </span>
                </div>

                <div style={styles.liveScores}>
                  <div
                    style={{
                      ...styles.scoreBox,
                      background: "#EEEDFE",
                      color: "#3C3489",
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      You ({meUsername})
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>•••</div>
                  </div>

                  <div
                    style={{
                      ...styles.scoreBox,
                      background: "#FAECE7",
                      color: "#993C1D",
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {opponentUsername ||
                        selectedOpponent?.username ||
                        "Opponent"}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                      {opponentScore === 0 ? "0" : "??"}
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    ...styles.cardSub,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Scores are hidden until both players finish.
                </p>

                <div style={styles.questionBlock}>
                  <p
                    style={{
                      ...styles.cardSub,
                      marginBottom: 6,
                      textAlign: "center",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    What does this word mean?
                  </p>

                  <h3
                    style={{
                      ...styles.cardTitle,
                      marginBottom: 16,
                      fontSize: 18,
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    "{q.word}"
                  </h3>

                  <div style={optionsGridStyle}>
                    {q.options.map((opt, idx) => {
                      const letter = OPTION_LETTERS[idx];
                      const plain = opt.replace(/^[A-D]\. /, "");
                      const isChosen = selectedAnswer === opt;
                      const isDisabled = result !== null;

                      const baseStyle: React.CSSProperties = isChosen
                        ? {
                            ...optionBtnBase,
                            borderColor: "#3C3489",
                            background: "#F8F7FF",
                          }
                        : optionBtnBase;

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswer(opt)}
                          disabled={isDisabled}
                          style={baseStyle}
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
                    <button
                      type="button"
                      onClick={nextQuestion}
                      style={nextBtnStyle}
                    >
                      {current + 1 >= questions.length - 1
                        ? "Finish"
                        : "Next →"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Result screen ────────────────────────────────────────────────────────
  if (
    (finished ||
      battleResult ||
      (status === "in_progress" && questions.length > 0)) &&
    battleResult
  ) {
    const isDraw = battleResult.includes("Draw");
    const isVictory = battleResult.includes("Victory");

    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <h2
              style={{
                ...styles.cardTitle,
                fontSize: 22,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {battleResult}
            </h2>

            {/* Winner/loser/draw summary line */}
            <p
              style={{
                ...styles.cardSub,
                textAlign: "center",
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              {isDraw
                ? "Both players scored the same — well played!"
                : isVictory
                  ? `You outscored ${opponentUsername || "your opponent"}`
                  : `${opponentUsername || "Your opponent"} outscored you this time`}
            </p>

            {/* Score comparison boxes */}
            <div style={styles.liveScores}>
              <div
                style={{
                  ...styles.scoreBox,
                  background: "#EEEDFE",
                  color: "#3C3489",
                  border: isVictory
                    ? "1.5px solid #3C3489"
                    : "0.5px solid #AFA9EC",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 500,
                  }}
                >
                  You
                </div>
                <div
                  style={{
                    fontSize: 13,
                    margin: "3px 0 8px",
                    color: "#534AB7",
                  }}
                >
                  {meUsername}
                </div>
                <div
                  style={{ fontSize: 32, fontWeight: 600, color: "#3C3489" }}
                >
                  {score}
                </div>
                <div style={{ fontSize: 11, color: "#534AB7", marginTop: 4 }}>
                  / {questions.length} correct
                </div>
              </div>

              <div
                style={{
                  ...styles.scoreBox,
                  background: "#FAECE7",
                  color: "#993C1D",
                  border:
                    !isVictory && !isDraw
                      ? "1.5px solid #993C1D"
                      : "0.5px solid #F0997B",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 500,
                  }}
                >
                  Opponent
                </div>
                <div
                  style={{
                    fontSize: 13,
                    margin: "3px 0 8px",
                    color: "#993C1D",
                  }}
                >
                  {opponentUsername || "Opponent"}
                </div>
                <div
                  style={{ fontSize: 32, fontWeight: 600, color: "#712B13" }}
                >
                  {opponentScore}
                </div>
                <div style={{ fontSize: 11, color: "#993C1D", marginTop: 4 }}>
                  / {questions.length} correct
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={leaveBattle}
                style={{ ...styles.startBtn, flex: 1 }}
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{ ...styles.secondaryBtn, flex: 1 }}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Idle / lobby screen ──────────────────────────────────────────────────
  const pendingBattles = challenges;

  const JoinPendingBattleUI = () => {
    if (!pendingBattles.length) return null;
    if (battleId !== null) return null;

    return (
      // CHANGE 2: highlighted challenge card
      <div style={styles.challengeCard}>
        <div style={styles.challengeBadge}>⚔️ Challenges waiting</div>
        <h3 style={{ ...styles.cardTitle, marginBottom: 4, color: "#26215C" }}>
          Join a waiting battle
        </h3>
        <p style={{ ...styles.cardSub, marginBottom: 12, color: "#534AB7" }}>
          A challenger is ready — jump in to start immediately.
        </p>

        <div style={styles.pendingGrid}>
          {pendingBattles.map((b) => (
            <button
              key={b.battle_id}
              type="button"
              onClick={() => joinBattle(b.battle_id)}
              disabled={joiningBattleId === b.battle_id}
              style={styles.pendingBtn}
            >
              <div style={{ fontWeight: 700, color: "#26215C" }}>
                {b.challenger_username}
              </div>
              <div style={{ fontSize: 12, color: "#534AB7" }}>
                Battle #{b.battle_id} · {b.question_count} Q
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{ ...styles.backBtn, opacity: 0.8 }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.8")
            }
          >
            ← Dashboard
          </button>
          <h2 style={{ ...styles.cardTitle, margin: "12px 0 4px" }}>
            ⚔️ Multiplayer Quiz Battle
          </h2>
          <p style={styles.cardSub}>
            Challenge another player from the leaderboard and battle
            head-to-head in real time.
          </p>
          {error && <p style={styles.errorText}>Error: {error}</p>}
          {joinError && <p style={styles.errorText}>Join Error: {joinError}</p>}
        </div>

        <JoinPendingBattleUI />

        <div style={styles.card}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>
            1. Choose Active Player
          </h3>
          <p style={{ ...styles.cardSub, marginBottom: 12 }}>
            Select a player to challenge.
          </p>

          {fetching ? (
            <p style={styles.loadingText}>Loading players…</p>
          ) : opponentPlayers.length === 0 ? (
            <p style={styles.loadingText}>No players available.</p>
          ) : (
            // CHANGE 1: scrollable player grid
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
                      <div style={{ fontSize: 12, color: "#888780" }}>
                        Score: {p.score}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {opponentId && (
          <div style={styles.card}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 4 }}>
              2. How many questions?
            </h3>
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
              {loading
                ? "Loading questions…"
                : `Start ${count}-Question Battle`}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{ ...styles.secondaryBtn, marginTop: 8 }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

// CHANGE 1: compact scrollable grid, 220px max-height
const playerGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  gridTemplateColumns: "1fr",
  maxHeight: 520,
  overflowY: "auto",
  paddingRight: 8,
  alignContent: "start",
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
const playerCardActive: React.CSSProperties = {
  borderColor: "#3C3489",
  background: "#F8F7FF",
};

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

const countBtnDefault: React.CSSProperties = {
  background: "#fff",
  borderColor: "#B4B2A9",
  color: "#2C2C2A",
};
const countBtnActive: React.CSSProperties = {
  background: "#EEEDFE",
  borderColor: "#3C3489",
  color: "#3C3489",
};

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

/**
 * NOTE:
 * These styles are kept for possible future UI states,
 * but currently unused in this component.
 * Removed unused-vars lint errors by not declaring unused constants.
 */

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
  // CHANGE 2: highlighted challenge card style
  challengeCard: {
    background: "#EEEDFE",
    border: "1.5px solid #3C3489",
    borderLeft: "4px solid #3C3489",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  challengeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#3C3489",
    color: "#fff",
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 20,
    marginBottom: 8,
    letterSpacing: "0.05em",
  } as React.CSSProperties,
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
  pendingGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
    marginTop: 12,
  },
  pendingBtn: {
    borderRadius: 10,
    border: "0.5px solid #AFA9EC",
    background: "#fff",
    padding: "0.9rem 1rem",
    cursor: "pointer",
    textAlign: "left",
  },
};

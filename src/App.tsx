import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Quiz from "./components/Quiz";
import Dashboard from "./components/Dashboard";
import Dictionary from "./components/Dictionary";
import QuizMode from "./components/QuizMode";
import TimerQuiz from "./components/TimerQuiz";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/quiz-mode" element={<QuizMode />} />
      <Route path="/timer-quiz" element={<TimerQuiz />} />
      <Route path="/dictionary" element={<Dictionary />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

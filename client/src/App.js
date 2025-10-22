import { useState } from "react";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState(null);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();

    if (!inputText.trim()) {
      setError("Please enter text to generate a quiz.");
      return;
    }

    setLoading(true);
    setQuestions(null);
    setError(null);
    setCurrentQuestionIndex(0);
    setQuizFinished(false);

    try {
      const response = await fetch("http://localhost:5000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate quiz due to a server error."
        );
      }

      if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuestions(data.quiz);
        setQuizStarted(true);
      } else {
        setError(
          "The AI model returned an empty or invalid quiz. Try again with a longer text."
        );
        setQuizStarted(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (selectedOption) => {
    if (quizFinished || !questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correct_answer) {
      setScore(score + 1);
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setQuizFinished(true);
    }
  };

  const renderQuiz = () => {
    if (!questions || questions.length === 0) {
      return <p>Error: No questions loaded. Please try again.</p>;
    }

    if (quizFinished) {
      return (
        <div className="quiz-results">
          <h2>Quiz Finished! 🎉</h2>
          <p>
            Your final score is:{" "}
            <span className="score">{score}</span> out of {questions.length}
          </p>
          <button
            className="restart-button"
            onClick={() => window.location.reload()}
          >
            Start New Quiz
          </button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="question-container">
        <p className="score-display">
          Score: {score} / {questions.length}
        </p>
        <p className="question-number">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>

        <h3 className="question-text">{currentQuestion.question}</h3>

        <div className="options-grid">
          {currentQuestion.options.map((option, i) => (
            <button
              key={i}
              className="option-button"
              onClick={() => handleAnswerClick(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header>
        <h1>QuizIt AI Generator</h1>
        <p>Create instant multiple-choice quizzes from any text.</p>
      </header>

      {loading && <div className="loading">Generating quiz...</div>}

      {error && (
        <div className="error-box">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {!quizStarted && (
        <div className="input-section">
          <form onSubmit={handleGenerateQuiz}>
            <h2>Enter your text for the quiz:</h2>
            <textarea
              rows="10"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text here (Recommended: 100+ words)"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate 5 Question Quiz"}
            </button>
          </form>
        </div>
      )}

      {quizStarted && questions && renderQuiz()}
    </div>
  );
}

export default App;

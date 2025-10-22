import { useState } from 'react';

// קומפוננטת האפליקציה הראשית
function App() {
  const [questions, setQuestions] = useState(null); // שינוי ל-null
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState(null);
  
  // פונקציה לטיפול בשליחת הטופס ויצירת המבחן
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();

    if (!inputText.trim()) {
        setError("Please enter text to generate a quiz.");
        return;
    }

    // איפוס מצב והתחלת טעינה
    setLoading(true);
    setQuestions(null);
    setError(null);
    setCurrentQuestionIndex(0); // ודא שמתחיל מהשאלה הראשונה
    setQuizFinished(false);

    try {
        const response = await fetch("http://localhost:5000/generate-quiz", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: inputText }),
        });

        const data = await response.json();

        if (!response.ok) {
            // טיפול בשגיאות מהשרת (כגון 400 או 500)
            throw new Error(data.error || "Failed to generate quiz due to a server error.");
        }

        if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
            setQuestions(data.quiz);
            setQuizStarted(true);
        } else {
            setError("The AI model returned an empty or invalid quiz. Try a longer or more detailed text.");
            setQuizStarted(false);
        }

    } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  // פונקציה לטיפול בבחירת תשובה
  const handleAnswerClick = (selectedOption) => {
    if (quizFinished || !questions) return;
    
    // 1. בדיקת התשובה
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correct_answer) {
      setScore(score + 1);
    }

    // 2. מעבר לשאלה הבאה או סיום המבחן
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      setQuizFinished(true);
    }
  };
  
  // רכיב להצגת השאלה הנוכחית ואפשרויות התשובה
  const renderQuiz = () => {
    if (!questions || questions.length === 0) {
        return <p>Error: No questions loaded. Please try generating the quiz again.</p>;
    }
    
    // אם המבחן הסתיים, הצג את התוצאות
    if (quizFinished) {
        return (
            <div className="quiz-results p-8 bg-gray-100 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-4 text-indigo-700">Quiz Finished! 🎉</h2>
                <p className="text-xl mb-6">Your final score is: <span className="font-extrabold text-2xl text-green-600">{score}</span> out of {questions.length}</p>
                <button 
                    onClick={() => {
                        window.location.reload(); // פתרון קל לאיפוס
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
                >
                    Start New Quiz
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    return (
        <div className="question-container border-2 border-indigo-500 p-6 rounded-xl shadow-lg bg-white">
            <p className="score-display text-lg font-semibold text-indigo-600 mb-2">Score: {score} / {questions.length}</p>
            <p className="question-number text-xl font-bold mb-4 text-gray-700">Question {currentQuestionIndex + 1} of {questions.length}</p>
            
            <h3 className="question-text text-2xl font-extrabold mb-8 text-gray-900">{currentQuestion.question}</h3>
            
            <div className="options-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                    <button 
                        key={index} 
                        className="option-button w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-500 transition duration-200 shadow-sm text-gray-800 font-medium"
                        onClick={() => handleAnswerClick(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
  };
  
  const currentQuestion = questions ? questions[currentQuestionIndex] : null;

  return (
    // שימוש ב-Tailwind CSS להצגה נאותה
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <header className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold text-gray-800">QuizIt AI Generator</h1>
            <p className="text-lg text-gray-500 mt-2">Create instant, multiple-choice quizzes from any text.</p>
        </header>

        
        {/* טעינת נתונים / שגיאה */}
        {loading && (
            <div className="p-4 text-xl text-indigo-600 font-semibold">
                 Generating your quiz from AI... (This might take a few seconds)
            </div>
        )}
        
        {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4 text-center">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
            </div>
        )}


        {/* שלב 1: קבלת הטקסט (מוצג רק לפני שהמבחן מתחיל) */}
        {!quizStarted && (
            <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl">
                <form onSubmit={handleGenerateQuiz}>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Enter your text for the quiz:</h2>
                    <textarea
                        rows="10"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none text-gray-800"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste Text for Quiz Generation (Recommended: over 100 words for better results)"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-green-500 text-white font-bold text-lg rounded-lg hover:bg-green-600 transition duration-300 disabled:bg-gray-400 shadow-md"
                    >
                        {loading ? 'Generating Quiz...' : 'Generate 5 Question Quiz'}
                    </button>
                </form>
            </div>
        )}
        
        {/* שלב 2: הצגת המבחן (מוצג רק אם המבחן התחיל) */}
        {quizStarted && questions && (
            <div className="w-full max-w-2xl">
                {renderQuiz()}
            </div>
        )}

    </div>
  );
}

export default App;

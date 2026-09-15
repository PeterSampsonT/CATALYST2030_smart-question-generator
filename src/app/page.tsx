'use client';

import { useState } from 'react';

interface Question {
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastWrongQuestion, setLastWrongQuestion] = useState<Question | null>(null);

  const fetchQuestion = async (customDifficulty?: 'Easy' | 'Medium' | 'Hard', wrongQ?: Question | null) => {
    if (!topic.trim()) return;
    setLoading(true);
    setFeedback(null);
    setSelectedOption(null);

    const activeDiff = customDifficulty || difficulty;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty: activeDiff,
          previousWrongQuestion: wrongQ || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentQuestion(data);
      } else {
        alert(data.error || 'Failed to fetch question');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null || !currentQuestion) return;

    setSelectedOption(index);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = index === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setFeedback('🎉 Correct! ' + currentQuestion.explanation);
      setLastWrongQuestion(null);

      // Scale difficulty up on correct answer
      let nextDiff: 'Easy' | 'Medium' | 'Hard' = difficulty;
      if (difficulty === 'Easy') nextDiff = 'Medium';
      else if (difficulty === 'Medium') nextDiff = 'Hard';

      setDifficulty(nextDiff);
    } else {
      setFeedback(
        `❌ Incorrect. Correct answer: ${currentQuestion.options[currentQuestion.correctAnswer]}. ${currentQuestion.explanation}`
      );
      setLastWrongQuestion(currentQuestion);

      // Scale difficulty down on wrong answer
      let nextDiff: 'Easy' | 'Medium' | 'Hard' = difficulty;
      if (difficulty === 'Hard') nextDiff = 'Medium';
      else if (difficulty === 'Medium') nextDiff = 'Easy';

      setDifficulty(nextDiff);
    }
  };

  const handleNextQuestion = () => {
    fetchQuestion(difficulty, lastWrongQuestion);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-400">Adaptive Question Generator</h1>
          <p className="text-slate-400">AI Quiz System with Dynamic Difficulty Scaling</p>
        </header>

        {/* Dynamic Stats Bar */}
        <div className="grid grid-cols-3 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div>
            <p className="text-xs text-slate-400">Current Level</p>
            <p className="text-xl font-bold text-yellow-400">{difficulty}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Score</p>
            <p className="text-xl font-bold text-green-400">{score}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Attempts</p>
            <p className="text-xl font-bold text-blue-400">{totalAttempts}</p>
          </div>
        </div>

        {/* Topic Entry */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Enter Topic</label>
            <input
              type="text"
              placeholder="e.g. Data Structures, Physics, History"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => fetchQuestion(difficulty, null)}
            disabled={loading || !topic.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-semibold transition"
          >
            {loading ? 'Generating...' : 'Start / Reset Quiz'}
          </button>
        </div>

        {/* Question & Interaction Card */}
        {currentQuestion && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Topic: {currentQuestion.topic}</span>
              <span className="px-2 py-1 bg-slate-700 rounded text-blue-300">
                Level: {currentQuestion.difficulty}
              </span>
            </div>

            <h2 className="text-lg font-medium">{currentQuestion.question}</h2>

            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => {
                let btnStyle = 'bg-slate-900 hover:bg-slate-700 border-slate-700';

                if (selectedOption !== null) {
                  if (idx === currentQuestion.correctAnswer) {
                    btnStyle = 'bg-green-900/60 border-green-500 text-green-200';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-red-900/60 border-red-500 text-red-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={selectedOption !== null}
                    className={`w-full p-3 rounded-lg border text-left transition ${btnStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-sm leading-relaxed">
                  {feedback}
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition"
                >
                  {lastWrongQuestion ? 'Try Similar Reinforcement Question' : 'Next Question'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
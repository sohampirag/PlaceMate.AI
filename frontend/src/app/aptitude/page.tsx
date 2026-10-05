"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";

export default function AptitudePage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const role = localStorage.getItem("targetRole") || "Software Engineer";
        const res = await api.get(`/api/practice/aptitude?target_role=${encodeURIComponent(role)}`);
        setQuestions(res.data);
      } catch (error) {
        console.error("Failed to load questions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleOptionSelect = (qId: number, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/api/practice/aptitude/submit", {
        questions,
        answers,
      });
      setResult(res.data);
      localStorage.setItem("aptitudeScore", res.data.score.toFixed(0));
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to grade test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Generating 20 aptitude questions...</div>;
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-20 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h1>
        <p className="text-gray-600 mb-6">You scored {result.correct} out of {result.total}</p>
        <div className="text-5xl font-bold text-blue-600 mb-8">{result.score.toFixed(0)}%</div>
        <button 
          onClick={() => router.push("/rounds")}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800"
        >
          Return to Rounds
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Aptitude Assessment</h1>
        <div className="flex items-center gap-2 text-amber-600 font-semibold bg-amber-50 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5" />
          <span>Timed Practice</span>
        </div>
      </div>
      
      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.id || index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label 
                      key={optIdx} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        answers[q.id || index] === optIdx 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input 
                        type="radio"
                        name={`question-${q.id || index}`}
                        className="w-4 h-4 text-blue-600"
                        checked={answers[q.id || index] === optIdx}
                        onChange={() => handleOptionSelect(q.id || index, optIdx)}
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length !== questions.length}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
        >
          {submitting ? "Grading..." : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}

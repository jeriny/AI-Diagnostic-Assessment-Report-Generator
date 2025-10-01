// src/pages/InputPage.tsx
// 학생 이름과 답안을 입력받는 페이지 컴포넌트

import React from 'react';
import type { StudentAnswers } from "../types/types";

interface InputPageProps {
  studentName: string;
  setStudentName: (name: string) => void;
  studentAnswers: StudentAnswers;
  handleAnswerChange: (questionNumber: number, answer: string) => void;
  handleGenerateReport: () => void;
  isLoading: boolean;
  error: string | null;
}

const InputPage: React.FC<InputPageProps> = ({
  studentName,
  setStudentName,
  studentAnswers,
  handleAnswerChange,
  handleGenerateReport,
  isLoading,
  error
}) => {
  const questionNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <main className="container mx-auto p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-4 text-slate-600">입력 정보</h2>
        
        {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded-lg text-center">{error}</div>}

        <div className="mb-6">
          <label htmlFor="studentName" className="block text-lg font-medium text-slate-700 mb-2">학생 이름</label>
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="예: 김수학"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            aria-label="Student Name"
          />
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-slate-700 mb-4">학생 답안 (25문항)</h3>
          <p className="text-slate-500 mb-4 text-sm">학생이 제출한 답을 각 문항에 입력해주세요. (예: 1, 2, 3, 4, 5)</p>
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {questionNumbers.map(qNum => (
              <div key={qNum} className="flex items-center p-2 border rounded-lg space-x-2">
                <label htmlFor={`q-${qNum}`} className="font-semibold text-slate-600 text-sm md:text-base whitespace-nowrap">{qNum}번</label>
                <input
                  id={`q-${qNum}`}
                  type="text"
                  value={studentAnswers[qNum]}
                  onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                  className="w-full text-center px-1 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                  maxLength={5}
                  aria-label={`Answer for question ${qNum}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105 flex items-center justify-center"
          >
            <i className="fas fa-check-circle mr-2"></i>결과지 생성하기
          </button>
        </div>
      </div>
    </main>
  );
};

export default InputPage;
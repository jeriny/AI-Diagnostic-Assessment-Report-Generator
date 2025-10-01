// src/App.tsx
// 최상위 앱 컴포넌트

import React, { useState, useCallback } from 'react';
import type { StudentAnswers, CorrectnessMap } from "./types/types";
import { CORRECT_ANSWERS, INITIAL_STUDENT_ANSWERS } from './constants/constants';
import { generateReport } from './services/geminiService';
import InputPage from './pages/InputPage';
import ReportPage from './pages/ReportPage';

const App: React.FC = () => {
  const [view, setView] = useState<'input' | 'report'>('input');
  const [studentName, setStudentName] = useState<string>('');
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswers>(INITIAL_STUDENT_ANSWERS);
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 입력 값 필터링 로직을 제거하고 원래 상태로 복구했습니다.
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setStudentAnswers(prev => ({ ...prev, [questionNumber]: answer }));
  };

  const handleGenerateReport = useCallback(async () => {
    setError(null);
    if (!studentName.trim()) {
      setError('학생 이름을 입력해주세요.');
      return;
    }
    
    const firstUnanswered = Object.keys(studentAnswers).find(qNum => studentAnswers[parseInt(qNum)].trim() === '');
    if (firstUnanswered) {
        setError(`모든 문항의 답을 입력해주세요. (${firstUnanswered}번 문항)`);
        return;
    }

    setIsLoading(true);
    setReport('');
    setView('report');

    try {
      const correctnessMap: CorrectnessMap = {};
      for (const qNum in studentAnswers) {
          const num = parseInt(qNum, 10);
          correctnessMap[num] = studentAnswers[num].trim() === CORRECT_ANSWERS[num] ? 'O' : 'X';
      }

      const generatedReport = await generateReport(studentName, correctnessMap);
      setReport(generatedReport);
    } catch (e) {
      console.error(e);
      setError('보고서 생성 중 오류가 발생했습니다. AI 서비스 키를 확인하거나 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [studentName, studentAnswers]);

  const handleBackToInput = () => {
    setView('input');
    setError(null);
    setReport('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">
            <i className="fas fa-magic-wand-sparkles mr-3 text-blue-500"></i>AI 진단평가 결과지 자동 생성
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">학생의 답안을 입력하고 AI를 통해 맞춤형 결과지를 생성하세요.</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6">
        {view === 'input' ? (
          <InputPage 
              studentName={studentName}
              setStudentName={setStudentName}
              studentAnswers={studentAnswers}
              handleAnswerChange={handleAnswerChange}
              handleGenerateReport={handleGenerateReport}
              isLoading={isLoading}
              error={error}
          />
        ) : (
          <ReportPage
              studentName={studentName}
              report={report}
              isLoading={isLoading}
              error={error}
              handleBack={handleBackToInput}
          />
        )}
      </main>
    </div>
  );
};

export default App;
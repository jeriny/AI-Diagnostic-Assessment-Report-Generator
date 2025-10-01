// src/components/LoadingSpinner.tsx
// 로딩 스피너 컴포넌트

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-slate-600">AI가 맞춤형 결과지를 만들고 있습니다.</p>
      <p className="text-slate-500">잠시만 기다려 주세요...</p>
    </div>
  );
};

export default LoadingSpinner;
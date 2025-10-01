// src/types/types.ts
// 타입 정의 모음

export type Answer = 'O' | 'X';

export type CorrectnessMap = {
  [questionNumber: number]: Answer | null;
};

export type StudentAnswers = {
  [questionNumber: number]: string;
};

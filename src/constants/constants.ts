// src/constants/constants.ts
// 상수 정의: 정답, 배점, 문항별 행동영역, 고교유형 등.
import type { StudentAnswers } from "../types/types";

// 총 문항 수
export const TOTAL_QUESTIONS = 25;

// 학생 답안 초기값 (빈 문자열)
export const INITIAL_STUDENT_ANSWERS: StudentAnswers = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1)
  .reduce((acc, qNum) => {
    acc[qNum] = '';
    return acc;
  }, {} as StudentAnswers);

// 문항별 정답
export const CORRECT_ANSWERS: { [key: number]: string } = {
  1: '3', 2: '1', 3: '4', 4: '4', 5: '9',
  6: '2', 7: '2', 8: '1', 9: '18', 10: '11',
  11: '5', 12: '15', 13: '3', 14: '3', 15: '2',
  16: '2', 17: '5', 18: '3', 19: '4', 20: '5',
  21: '4', 22: '5', 23: '13', 24: '2', 25: '121'
};

// 문항별 배점
export const SCORING_WEIGHTS: { [key: string]: number } = {
  '1-5': 2,
  '6-10': 3,
  '11-18': 4,
  '19-22': 5,
  '23-24': 6,
  '25': 11,
};

// 문항별 행동영역 태그
export const QUESTION_BEHAVIORS: { [key: number]: string[] } = {
    1: ['계산', '이해'], 2: ['계산', '이해'], 3: ['계산', '이해'], 4: ['계산', '이해'], 5: ['계산', '이해'],
    6: ['이해', '추론'], 7: ['이해', '추론'], 8: ['이해', '문제해결'], 9: ['이해', '추론'], 10: ['이해', '문제해결'],
    11: ['추론', '문제해결'], 12: ['이해', '추론', '계산'], 13: ['문제해결', '추론'], 14: ['이해', '문제해결'], 15: ['추론', '문제해결', '계산'], 16: ['문제해결', '계산', '추론'], 17: ['추론', '이해'], 18: ['문제해결', '추론'],
    19: ['문제해결', '추론', '이해'], 20: ['문제해결', '추론', '계산'], 21: ['문제해결', '추론'], 22: ['문제해결', '추론', '이해'],
    23: ['문제해결', '추론'], 24: ['문제해결', '추론'], 25: ['문제해결', '추론', '이해']
};

// 행동영역 키/타입
export const BEHAVIOR_KEYS = ['계산', '이해', '추론', '문제해결'] as const;
export type BehaviorKey = typeof BEHAVIOR_KEYS[number];

// 고교유형 그룹
export const SCHOOL_GROUPS = [
  { group: "A", schools: ["운정고", "자사고"] },
  { group: "B", schools: ["저현고", "백석고", "주엽고"] },
  { group: "C", schools: ["고국고", "백신고", "백양고"] },
  { group: "D", schools: ["고양외고", "무원고", "정발고"] },
  { group: "E", schools: ["대화고", "화정고", "가좌고", "행신고"] },
  { group: "F", schools: ["안곡고", "저동고", "일산동고"] },
  { group: "G", schools: ["일산대진고"] },
] as const;

export type SchoolGroup = (typeof SCHOOL_GROUPS)[number];
export type SchoolGroupId = SchoolGroup["group"];

// 그룹별 등급 스케일(임시 기준치) — 필요시 여기만 조정하면 전체 로직이 따라갑니다.
// min 점수 이상이면 해당 등급/상위%로 매칭 (위에서 아래 순서로 탐색)
export const GROUP_GRADE_THRESHOLDS: Record<
  SchoolGroupId,
  Array<{ min: number; grade: string; topPercent: number }>
> = {
  // 자사고/외고 포함 그룹: 난이도 높음
  A: [
    { min: 90, grade: "1~2등급", topPercent: 10 },
    { min: 80, grade: "2~3등급", topPercent: 20 },
    { min: 70, grade: "3~4등급", topPercent: 35 },
    { min: 60, grade: "4~5등급", topPercent: 50 },
    { min: 0,  grade: "5등급 이하", topPercent: 60 },
  ],
  D: [
    { min: 90, grade: "1~2등급", topPercent: 10 },
    { min: 80, grade: "2~3등급", topPercent: 20 },
    { min: 70, grade: "3~4등급", topPercent: 35 },
    { min: 60, grade: "4~5등급", topPercent: 50 },
    { min: 0,  grade: "5등급 이하", topPercent: 60 },
  ],
  // 일반고 상위권 느낌
  B: [
    { min: 90, grade: "1등급", topPercent: 5 },
    { min: 80, grade: "1~2등급", topPercent: 10 },
    { min: 70, grade: "2~3등급", topPercent: 20 },
    { min: 60, grade: "3~4등급", topPercent: 35 },
    { min: 0,  grade: "4등급 이하", topPercent: 50 },
  ],
  F: [
    { min: 90, grade: "1등급", topPercent: 5 },
    { min: 80, grade: "1~2등급", topPercent: 10 },
    { min: 70, grade: "2~3등급", topPercent: 20 },
    { min: 60, grade: "3~4등급", topPercent: 35 },
    { min: 0,  grade: "4등급 이하", topPercent: 50 },
  ],
  // 일반고 중위권 느낌
  C: [
    { min: 80, grade: "1등급", topPercent: 8 },
    { min: 70, grade: "1~2등급", topPercent: 15 },
    { min: 60, grade: "2~3등급", topPercent: 30 },
    { min: 50, grade: "3~4등급", topPercent: 45 },
    { min: 0,  grade: "4등급 이하", topPercent: 60 },
  ],
  E: [
    { min: 80, grade: "1등급", topPercent: 8 },
    { min: 70, grade: "1~2등급", topPercent: 15 },
    { min: 60, grade: "2~3등급", topPercent: 30 },
    { min: 50, grade: "3~4등급", topPercent: 45 },
    { min: 0,  grade: "4등급 이하", topPercent: 60 },
  ],
  G: [
    { min: 80, grade: "1등급", topPercent: 8 },
    { min: 70, grade: "1~2등급", topPercent: 15 },
    { min: 60, grade: "2~3등급", topPercent: 30 },
    { min: 50, grade: "3~4등급", topPercent: 45 },
    { min: 0,  grade: "4등급 이하", topPercent: 60 },
  ],
};

// (참고) 섹션 3 제목에 쓰는 “구간 목표 상위 %”
export const RANGE_TARGETS: Record<string, number> = {
  "1-5": 90,
  "6-10": 75,
  "11-18": 40,
  "19-20": 20,
  "21-22": 10,
  "23-24": 6,
  "25": 2,
};
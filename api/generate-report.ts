// api/generate-report.ts

export const config = { runtime: 'nodejs' };
console.log('[api] GEMINI_API_KEY exists?', Boolean(process.env.GEMINI_API_KEY));

import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemInstruction, buildPrompt } from "./prompt.ts";
import {
  SCORING_WEIGHTS,
  QUESTION_BEHAVIORS,
  TOTAL_QUESTIONS,
  BEHAVIOR_KEYS,
  SCHOOL_GROUPS,
  GROUP_GRADE_THRESHOLDS,
  RANGE_TARGETS,
} from "../src/constants/constants.ts";
import type {
  BehaviorKey,
  SchoolGroup,
  SchoolGroupId,
} from "../src/constants/constants.ts";

type Answers = Record<number, "O" | "X">;

const MODEL = "gemini-2.5-flash";

// ── 점수/통계
function fillAnswers(a: Partial<Answers>): Answers {
  const out = {} as Answers;
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) out[i] = a?.[i] === "O" ? "O" : "X";
  return out;
}
function calculateScore(a: Answers) {
  let s = 0;
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    if (a[i] !== "O") continue;
    if (i <= 5) s += SCORING_WEIGHTS["1-5"];
    else if (i <= 10) s += SCORING_WEIGHTS["6-10"];
    else if (i <= 18) s += SCORING_WEIGHTS["11-18"];
    else if (i <= 22) s += SCORING_WEIGHTS["19-22"];
    else if (i <= 24) s += SCORING_WEIGHTS["23-24"];
    else if (i === 25) s += SCORING_WEIGHTS["25"];
  }
  return s;
}
function computeBehaviorStats(a: Answers) {
  const base = Object.fromEntries(
    BEHAVIOR_KEYS.map((k) => [k, { O: 0, X: 0, pct: 0 }])
  ) as Record<BehaviorKey, { O: number; X: number; pct: number }>;

  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const tags = (QUESTION_BEHAVIORS as Record<number, string[] | undefined>)[i];
    if (!tags || tags.length === 0) continue;
    const key = tags[0] as BehaviorKey; // 대표 영역 = 첫 태그
    (a[i] === "O" ? base[key].O++ : base[key].X++);
  }
  (BEHAVIOR_KEYS as readonly BehaviorKey[]).forEach((k) => {
    const { O, X } = base[k];
    const t = O + X;
    base[k].pct = t ? Math.round((O / t) * 100) : 0;
  });
  return base;
}
function buildBehaviorQuestionIndex() {
  const idx: Record<BehaviorKey, number[]> = {
    계산: [], 이해: [], 추론: [], 문제해결: [],
  };
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const tags = (QUESTION_BEHAVIORS as Record<number, string[] | undefined>)[i];
    if (!tags) continue;
    for (const t of tags) {
      if ((idx as any)[t]) (idx as any)[t].push(i);
    }
  }
  return idx;
}
function computeRangeStats(a: Answers) {
  const ranges: Record<string, [number, number]> = {
    "1-5": [1, 5],
    "6-10": [6, 10],
    "11-18": [11, 18],
    "19-20": [19, 20],
    "21-22": [21, 22],
    "23-24": [23, 24],
    "25": [25, 25],
  };
  const out: Record<string, { correct: number; wrong: number; acc: number }> = {};
  for (const key of Object.keys(ranges)) {
    const [s, e] = ranges[key];
    let O = 0, X = 0;
    for (let q = s; q <= e; q++) (a[q] === "O" ? O++ : X++);
    const total = O + X || 1;
    out[key] = { correct: O, wrong: X, acc: Math.round((O / total) * 100) };
  }
  return out;
}

// 그룹별 등급 계산(임계표 기반)
function pickGroupGrade(score: number, id: SchoolGroupId) {
  const table = GROUP_GRADE_THRESHOLDS[id];
  const found = table.find((row) => score >= row.min) ?? table[table.length - 1];
  return { grade: found.grade, predictedTopPercent: found.topPercent };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    if (!process?.env?.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const { studentName, answers } = (req.body || {}) as {
      studentName?: string;
      answers?: Partial<Answers>;
    };
    if (!studentName || typeof studentName !== "string") {
      return res.status(400).json({ error: "invalid studentName" });
    }

    const filled = fillAnswers(answers || {});
    const totalScore = calculateScore(filled);
    const totalScoreFormatted = totalScore.toFixed(1);

    const behaviorStats = computeBehaviorStats(filled);
    const behaviorQuestionIndex = buildBehaviorQuestionIndex();
    const rangeStats = computeRangeStats(filled);

    // 표 렌더용: “그룹 X — 학교,학교…”
    const groupsForPrompt: Array<{ label: string; group: SchoolGroupId; schools: string[] }> =
      (SCHOOL_GROUPS as readonly SchoolGroup[]).map((g) => ({
        label: `그룹 ${g.group} — ${g.schools.join(", ")}`,
        group: g.group,
        schools: [...g.schools],
      }));

    const groupGrades = (SCHOOL_GROUPS as readonly SchoolGroup[]).map((g) => {
      const { grade, predictedTopPercent } = pickGroupGrade(totalScore, g.group);
      return {
        group: g.group,
        label: `그룹 ${g.group} — ${g.schools.join(", ")}`,
        grade,
        predictedTopPercent,
      };
    });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction,
    });

    const prompt = buildPrompt({
      studentName,
      totalScore,
      totalScoreFormatted,
      behaviorStats,
      behaviorQuestionIndex,
      groups: groupsForPrompt,
      groupGrades,
      rangeTargets: RANGE_TARGETS,
      rangeStats,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const html = result.response
      .text()
      .replace(/^```html\s*/i, "")
      .replace(/```[\s]*$/i, "")
      .trim();

    return res.status(200).json({ html });
  } catch (e: any) {
    // 터미널에도 최대한 자세히 찍기
    console.error("[/api/generate-report] error:",
      e?.response?.status || "",
      e?.response?.statusText || "",
      e?.response?.data || "",
      e?.message || e
    );

    // 클라이언트에도 원문을 내려주어 Network 탭에서 바로 확인 가능
    return res.status(500).json({
      error: "AI 보고서 생성 실패",
      message: e?.response?.data?.error || e?.message || String(e),
    });
  }
}

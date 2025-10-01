// src/services/geminiService.ts
// 프론트(브라우저) 전용: 내부 서버리스 API만 호출.

import type { CorrectnessMap } from "../types/types";

export async function generateReport(studentName: string, answers: CorrectnessMap): Promise<string> {
  const res = await fetch("/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName, answers }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`리포트 생성 실패 (${res.status}): ${msg || "Unknown error"}`);
  }

  const data = (await res.json()) as { html?: string; error?: string };
  if (!data.html) throw new Error(data.error || "AI 결과 HTML이 비어 있습니다.");
  return data.html;
}
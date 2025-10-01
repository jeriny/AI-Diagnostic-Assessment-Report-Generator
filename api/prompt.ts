// api/prompt.ts
// ⛔️ 이 파일은 "HTML 조각(섹션 3~7)"만 생성하도록 프롬프트를 구성합니다.
//     <html>, <head>, <body>, <style>, ``` 코드펜스 출력 금지.
//     Tailwind 클래스만 사용합니다(프로젝트 전역 스타일/템플릿과 합쳐서 렌더).

export const systemInstruction = `
당신은 한국어 교육기관을 위한 보고서 생성 도우미입니다.
항상 다음을 지키세요.
- 오직 섹션 3~7만 HTML로 생성합니다(섹션 1~2는 클라이언트에서 렌더).
- Tailwind CSS 클래스를 사용합니다. (h3/h4/p/ul/li/table/thead/tbody/tr/th/td 등)
- PDF 친화: 문단은 너무 길지 않게, 핵심을 짧게 요약합니다.
- 코드펜스(\`\`\`)와 <html>/<head>/<body>/<style>/<script> 태그를 출력하지 않습니다.
`;

type BehaviorStat = { O: number; X: number; pct: number };
type BehaviorIndex = Record<string, number[]>;
type RangeStat = { correct: number; wrong: number; acc: number };
type GroupGrade = { group: string; label: string; grade: string; predictedTopPercent: number };
type GroupForPrompt = { label: string; group: string; schools: string[] };

/**
 * buildPrompt
 * 클라이언트 템플릿(섹션 1~2)과 호환되도록, 섹션 3~7만 AI가 채우게 지시합니다.
 */
export function buildPrompt(p: {
  studentName: string;
  totalScore: number;
  totalScoreFormatted: string;
  behaviorStats: Record<string, BehaviorStat>;
  behaviorQuestionIndex: BehaviorIndex;
  groups: GroupForPrompt[];
  groupGrades: GroupGrade[];
  rangeTargets: Record<string, number>;
  rangeStats: Record<string, RangeStat>;
}) {
  const {
    studentName,
    totalScore,
    totalScoreFormatted,
    behaviorStats,
    behaviorQuestionIndex,
    groups,
    groupGrades,
    rangeTargets,
    rangeStats,
  } = p;

  // 프롬프트에 넣을 데이터(LLM이 규칙적으로 선택할 수 있도록 숫자/목록을 그대로 제공)
  const data = {
    studentName,
    totalScore,
    totalScoreFormatted,
    behaviorStats,
    behaviorQuestionIndex,
    groups,
    groupGrades,
    rangeTargets,
    rangeStats,
  };

  // 섹션3에서 "오답이 많음"/"모두 정답" 판단 기준(모델 안내용 규칙)
  // - 오답이 많음: accuracy < 60
  // - 모두 정답: accuracy == 100
  // - 그 외: "정답률이 높음/보통" 문장을 선택(범위별 안내 문구에 맞춰 자연스럽게 서술)
  const decisionRules = {
    manyWrongThreshold: 60,
    perfectThreshold: 100,
    highThreshold: 80, // 11~18 같은 범위에서 "정답률이 높음" 판단 참고치
  };

  return `
다음은 보고서 생성을 위한 입력 데이터입니다.

[DATA JSON]
${JSON.stringify({ data, decisionRules }, null, 2)}

[작업]
아래 "섹션 템플릿"을 바탕으로, 섹션 3~7의 HTML을 생성하세요.
- 각 섹션 제목(h3)과 소제목(h4), 문단(p), 목록(ul/li), 표(table)을 Tailwind로 꾸밉니다.
- "학생 이름", 정답률/점수/등급 등 동적 값은 DATA JSON의 값을 사용하여 실제 수치로 채웁니다.
- 섹션 3의 각 카드에서는 **의미 문장 1개만** 선택해 출력합니다(결정 규칙 참조).
- 섹션 4의 '총평'은 총점 구간에 따라 다음 등급을 사용합니다.
   >85: 최상위권 / 70~84: 상위권 / 50~69: 중위권 / <50: 기초 다지기 필요
- 섹션 4의 '행동 영역 분석'은 behaviorStats와 behaviorQuestionIndex를 이용해
  각 영역(계산/이해/추론/문제해결)의 정답률과 대표 문항 번호를 함께 서술합니다.
  정답률 판정 가이드: 높음(>=80), 보통(60~79), 낮음(<60).
- 섹션 4의 '학생 성향 분석'은 rangeStats(1-5, 6-10, 11-18, 19-20, 21-22, 23-24, 25)를 활용해
  조건부 멘트를 하나 이상 고르되, 학생 상황에 맞게 2~3개 정도로 간결히 제시합니다.
- 섹션 5는 groupGrades를 사용하여 “그룹(학교)” vs “예상 내신 등급(상위 %)” 표를 생성합니다.
- 섹션 6은 그룹별로 예상 등급을 재명시하고, 약점(정답률이 가장 낮은 행동 영역)을 반영한 공부 방향/학습 전략을 소제목/문단으로 작성합니다.
- 섹션 7은 단기(1~3개월) 2~3개, 장기(6개월+) 2~3개의 목표를 제시하되,
  약점 영역을 우선 보완하고 강점을 유지·확장하는 과제로 구성합니다.

[섹션 템플릿: 아래 구조와 톤을 따라 HTML만 출력]
<!-- 3. 문제 번호 범위 별 난이도 및 정오에 대한 의미 안내 -->
<h3 class="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mt-8 mb-6">3. 문제 번호 범위 별 난이도 및 정오에 대한 의미 안내</h3>
<p class="text-slate-700 leading-relaxed mb-6">
  본 진단평가는 ${studentName} 학생의 수학적 역량을 다각도로 진단하기 위해 난이도별로 구성되어 있습니다.
  각 구간의 문제 해결 여부를 통해 현재 학습 수준을 파악하고, 앞으로의 학습 방향을 탐색할 수 있습니다.
</p>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <!-- 각 카드: p-5 border rounded-lg bg-slate-50 shadow-sm flex flex-col h-full -->
  <!-- 범위: 1-5 / 6-10 / 11-18 / 19-20 / 21-22 / 23-24 / 25 -->
  <!-- 제목: "n~m번 문제 (라벨 - 상위 {rangeTargets[key]}% 목표)" -->
  <!-- 특징: 문제 특성 문장 -->
  <!-- 의미: DATA.rangeStats[key].acc와 decisionRules를 이용해 해당되는 문장 1개만 출력 -->
</div>

<!-- 4. 진단평가 결과 (학습 성취도, 행동 영역 분석, 학생 성향 분석) -->
<h3 class="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mt-8 mb-6">4. 진단평가 결과 (학습 성취도, 행동 영역 분석, 학생 성향 분석)</h3>
<h4 class="font-bold text-lg text-slate-800 mb-2">1) 학습 성취도</h4>
<p class="text-slate-700">
  전체 점수: <strong>${totalScoreFormatted}점</strong> (난이도별 차등 배점, 최대 100점)<br/>
  <strong>총평:</strong> 점수 구간에 따른 등급과, 구간별 정오 분석을 반영한 1~2문장 총평을 제시하세요.
</p>

<h4 class="font-bold text-lg text-slate-800 mb-2 mt-4">2) 행동 영역 분석</h4>
<ul class="list-disc pl-6 text-slate-700">
  <!-- 각 항목: "<strong>계산</strong> (문항: 1, 2, 3...): 정답률 72% — [높음/보통/낮음] 코멘트" -->
  <!-- 계산/이해/추론/문제해결 순으로 모두 출력 -->
</ul>

<h4 class="font-bold text-lg text-slate-800 mb-2 mt-4">3) 학생 성향 분석</h4>
<ul class="list-disc pl-6 text-slate-700">
  <!-- 아래 조건 가이드를 참고해 2~3개 정도 해당되는 성향을 선택/서술 -->
  <!-- IF 21~25 정답이 일부 존재 & 1~10 오답 많음: "잠재력 높으나 기초 실수 잦음..." -->
  <!-- IF 1~5 모두 정답 & 21~25 오답 많음: "개념 탄탄, 고난도/복합 사고 훈련 필요..." -->
  <!-- IF 1~10 오답 많고 전반 오답 많음: "기초 다지기 필요, 체계적 개념 학습부터..." -->
  <!-- IF 11~25 오답 많음: "심화 추론/해결력 향상 필요..." -->
  <!-- IF 전반 고른 정답률: "고른 이해, 심층 학습으로 최상위권 도약 모색..." -->
  <!-- IF 21~25 정답률 높음: "최상위권, 심화 탐구 및 경시 준비..." -->
</ul>

<!-- 5. 학생의 고등학교 그룹 별 예상 등급 -->
<h3 class="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mt-8 mb-6">5. 학생의 고등학교 그룹 별 예상 등급</h3>
<p class="text-slate-700 mb-3">
  ${studentName} 학생의 이번 진단평가 점수와 현재 역량을 고려했을 때, 목표하는 고등학교 그룹에 따른 예상 등급은 다음과 같습니다.
</p>
<div class="overflow-x-auto">
  <table class="w-full">
    <thead>
      <tr class="bg-slate-100">
        <th class="p-3 border text-left">그룹(학교)</th>
        <th class="p-3 border text-left">예상 내신 등급 (상위 % 추정)</th>
      </tr>
    </thead>
    <tbody>
      <!-- groupGrades 배열을 순회하여
           <tr><td>{label}</td><td>{grade} (상위 {predictedTopPercent}%대)</td></tr> -->
    </tbody>
  </table>
</div>
<p class="text-slate-600 text-sm mt-2">※ 상위 %는 점수-그룹 기준표에 따른 추정치이며, 실제 경쟁도에 따라 달라질 수 있습니다.</p>

<!-- 6. 현재 상태에서 고등학교 그룹 별 예상 등급 및 공부 방향 -->
<h3 class="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mt-8 mb-6">6. 현재 상태에서 고등학교 그룹 별 예상 등급 및 공부 방향</h3>
<!-- 각 그룹에 대해 섹션 생성: 제목(h4) + 예상 등급 재명시 + 공부 방향 + 학습 전략 -->
<!-- 약점은 behaviorStats에서 pct가 가장 낮은 행동 영역을 '주요 약점'으로 사용하여 구체화 -->

<!-- 7. 현재로써 학생의 최적 커리큘럼 제시 -->
<h3 class="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3 mt-8 mb-6">7. 현재로써 학생의 최적 커리큘럼 제시</h3>
<p class="text-slate-700 mb-4">
  ${studentName} 학생의 현재 진단평가 결과를 바탕으로, 최적의 학습 성장을 위한 맞춤형 커리큘럼을 제안합니다.
  강점은 살리고 약점은 빠르게 보완하는 방향으로, 아래와 같이 단계별 계획을 제시하세요.
</p>
<ul class="list-disc pl-6 text-slate-700">
  <li><strong>1단계(약 2주)</strong>: 가장 취약한 행동 영역 집중(개념 재정비, 연산/핵심 유형 15~20문항/일, 오답 노트 즉시 기록)</li>
  <li><strong>2단계(약 3주)</strong>: 개념 적용·문제해결 강화(도형/그래프/복합 유형, 조건 분해 → 전략 수립 → 검산 루틴)</li>
  <li><strong>3단계(약 4주)</strong>: 심화 추론 및 실전 적응(고난도 통합형·모의고사, 제한시간 훈련, 실수 유형 체크리스트)</li>
</ul>
<p class="text-slate-700 mt-2">
  각 단계는 주간 목표(횟수·분량)를 수치화하고, 필요시 교재/인강을 수준에 맞게 1권씩 지정하여 관리하세요.
</p>
`;
}

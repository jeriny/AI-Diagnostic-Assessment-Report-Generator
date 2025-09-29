# AI-Diagnostic-Assessment-Report-Generator
5A-진단평가 보고서 생성


동훈.

# 1) 검증

* `App.tsx`: 루트에서 상태·라우팅(‘input’/‘report’) 관리, 정오표 생성 후 `generateReport` 호출 구조 확인. 컴포넌트 import 경로와 서비스/상수/타입 의존성 일관. 
* `index.html`: CDN 기반 React/Tailwind/@google/genai, html2canvas, jsPDF(UMD) 로드, import map 사용, `/index.tsx` 모듈 엔트리. 
* `index.tsx`: `createRoot`로 `App` 마운트. 
* `components/InputPage.tsx`: 25문항 고정 입력, 이름/답 미입력 경고는 상위(App)에서 처리. 경로 기준으로 보면 `components` 하위에 존재 가정(`../types` import). 
* `components/LoadingSpinner.tsx`: 오버레이 스피너. 
* `components/ReportDisplay.tsx`: `dangerouslySetInnerHTML`로 AI 리포트 HTML 삽입. 
* `components/ReportPage.tsx`: PDF 내보내기 버튼, `window.jspdf` 사용, 여백 `[20,18,20,18]` 지정, 헤더/푸터 직접 그리기. 폰트 임베딩 제거 주석 존재. 
* 미열람 파일: `constants.ts`, `services/geminiService.ts` 내용 미확인(불확실). 해당 파일 내 상수 구조·프롬프트 로직은 추정임(확실하지 않음).

# 2) 구조 판단

* 현재 폴더링(`components/`, `services/`, `constants.ts`, `types.ts`, 루트 엔트리)만으로 단일 페이지 앱은 충분. 필수적인 디렉터리 개편 필요 없음(확실).
* 선택 개선 여지만 있음: `InputPage`/`ReportPage`는 “페이지” 성격이므로 `pages/`로 이동하고, 공용 UI(`LoadingSpinner`, `ReportDisplay`)는 `components/` 유지하는 정리가 의미 있음(권장이나 필수 아님).

# 3) 즉시 수정 권고(확실)

1. PDF 한글 글꼴 문제

* `ReportPage`에서 `pdf.text('진단평가 결과지', …)`는 jsPDF 기본 폰트로 한글이 깨질 수 있음. 헤더 문자열을 ASCII로 교체하거나(예: `'Report'`) 임베딩 복구 필요. 임시 해결: 헤더를 비우고 푸터만 두거나 `'Report'`로 변경. 위치: `ReportPage.tsx` 헤더 텍스트 부분. 

2. 입력 검증 강화

* 답 입력은 선택지(예: 1~5)인 듯하므로 `InputPage`의 `<input>`에 패턴 제한 추가(정규식 `^[1-5]$` 등) 및 `App.tsx`의 검증에도 동일 규칙을 반영. 현재는 공백 여부만 검사.

3. 리포트 렌더 보안/안정성

* `ReportDisplay`의 `dangerouslySetInnerHTML`은 필수 구조일 수 있으나, 생성 단계에서 화이트리스트 태그만 허용하도록 `generateReport` 쪽에서 정규화/필터링 구현 권장(현재 컴포넌트는 무가공 삽입). 
* PDF 캡처도 해당 DOM을 그대로 사용하므로 동일 정규화 적용 필요(확실).

4. 오류 UX 일관화

* `ReportPage`는 `error`가 있을 때 배너를 띄우지만, 본문 기본 상태 문구가 “오류가 발생했습니다”로 고정되어 있어 혼동 가능. `error` 존재 시 기본 빈 상태 문구를 숨기고, 입력 페이지로 복귀 버튼만 노출 권장. 

5. 네비게이션 타이밍

* `App.tsx`가 보고서 생성 시작과 동시에 `setView('report')`를 호출. 로딩 중에도 보고서 화면으로 전환되는 현재 UX는 합리적이나, 사용자가 입력을 수정하려면 한 번 더 뒤로 가야 함. 요구사항에 따라 로딩은 입력 페이지에서 진행 후 성공 시 전환하는 방식도 선택지(선호도 문제, 확실하지 않음). 

# 4) 구조 개선 제안(선택)

* `src/` 루트 하위 정리

  * `pages/` : `InputPage.tsx`, `ReportPage.tsx`
  * `components/` : `ReportDisplay.tsx`, `LoadingSpinner.tsx`
  * `services/` : `geminiService.ts`
  * `data/` 또는 `config/` : `constants.ts`
  * `types/` : `types.ts`
* 장점: 관심사 분리 명확, 추후 라우팅/페이지 추가 용이. 단점: 경로 수정 필요(확실).

# 5) 코드 레벨 패치 스니펫(핵심만)

* 한글 헤더 제거(임시):

```ts
// ReportPage.tsx 헤더 부분
// pdf.text('진단평가 결과지', 18, 15); // 제거 또는
pdf.text('Report', 18, 15); // 임시 대체
```



* 입력 제약(예: 1~5 선택일 때):

```ts
// InputPage.tsx
<input
  ... 
  pattern="[1-5]"
  inputMode="numeric"
  onChange={(e)=>handleAnswerChange(qNum, e.target.value.replace(/[^1-5]/g,''))}
/>
```



# 결론

* 필수 디렉터리 개편 불필요.
* PDF 한글 헤더 처리, 입력 검증 강화, `dangerouslySetInnerHTML` 사전 정규화, 오류 UX 정리만 반영하면 현재 구조로 안정 운영 가능.

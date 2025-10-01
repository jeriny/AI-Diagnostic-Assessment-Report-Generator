// src/components/ReportDisplay.tsx
// AI가 생성한 보고서를 HTML로 안전하게 렌더링하는 컴포넌트

interface Props {
  reportHtml: string;
}

export default function ReportDisplay({ reportHtml }: Props) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: reportHtml }}
    />
  );
}

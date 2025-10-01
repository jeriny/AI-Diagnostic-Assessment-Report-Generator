// src/pages/ReportPage.tsx
// AI가 생성한 보고서를 보여주고 PDF로 다운로드하는 페이지 컴포넌트

import React, { useRef, useState, useCallback } from 'react';
import ReportDisplay from '../components/ReportDisplay'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { NOTO_SANS_KR_REGULAR_BASE64 } from '../constants/noto-sans-kr-font';

declare global {
    interface Window { jspdf: any; html2canvas: any; }
}

interface ReportPageProps {
    studentName: string;
    report: string;
    isLoading: boolean;
    error: string | null;
    handleBack: () => void;
}

const ReportPage: React.FC<ReportPageProps> = ({ studentName, report, isLoading, error, handleBack }) => {
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = useCallback(async () => {
        const { jsPDF } = window.jspdf;
        const reportElement = reportContentRef.current;

        if (!reportElement || !jsPDF || !window.html2canvas) {
            alert("PDF 생성에 필요한 라이브러리를 찾을 수 없습니다.");
            return;
        }

        setIsDownloading(true);

        try {
            const canvas = await window.html2canvas(reportElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgReportWidth = canvas.width;
            const imgReportHeight = canvas.height;
            const ratio = imgReportWidth / imgReportHeight;
            const contentWidth = pdfWidth - 36; // A4 가로(210mm) - 양쪽 여백(18mm * 2)
            const contentHeight = contentWidth / ratio;

            // ** 한글 폰트 추가 로직 **
            pdf.addFileToVFS('NotoSansKR-Regular.ttf', NOTO_SANS_KR_REGULAR_BASE64);
            pdf.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
            pdf.setFont('NotoSansKR');

            // Header (한글 폰트로 변경)
            pdf.setFontSize(18);
            pdf.text('AI 진단평가 결과지', 18, 20);
            
            // 본문 이미지 추가
            pdf.addImage(imgData, 'PNG', 18, 30, contentWidth, contentHeight);

            // Footer
            const pageCount = pdf.internal.getNumberOfPages();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(150);
                pdf.text(`Page ${i} of ${pageCount}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
            }

            pdf.save(`${studentName}_진단평가_결과지.pdf`);

        } catch (err) {
            console.error("PDF 생성 중 오류:", err);
            alert("PDF를 만드는 중 문제가 발생했습니다.");
        } finally {
            setIsDownloading(false);
        }
    }, [studentName]);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-semibold text-slate-600">{studentName} 학생 결과지</h2>
                <div className="flex space-x-2">
                    <button onClick={handleBack} className="bg-slate-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition">
                        <i className="fas fa-arrow-left mr-2"></i>뒤로
                    </button>
                    {!isLoading && !error && report && (
                        <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition flex items-center">
                            {isDownloading ? (<><i className="fas fa-spinner animate-spin mr-2"></i>다운로드 중...</>) : (<><i className="fas fa-file-pdf mr-2"></i>PDF 다운로드</>)}
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg text-center font-semibold">{error}</div>}
            
            <div id="report-content" ref={reportContentRef} className="prose max-w-none">
                {/* 오류가 없을 때만 ReportDisplay를 렌더링하도록 수정 */}
                {!isLoading && !error && report && <ReportDisplay reportHtml={report} />}
                {/* 로딩 아니고, 에러도 아니고, 리포트도 없을 때의 메시지 */}
                {!isLoading && !error && !report && (
                     <div className="flex flex-col items-center justify-center text-slate-400 py-20">
                        <i className="fas fa-exclamation-circle text-6xl mb-4"></i>
                        <p className="text-xl">표시할 결과가 없습니다.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

export default ReportPage;
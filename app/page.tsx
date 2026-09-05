"use client";

import React, { useState } from "react";

// 키워드 데이터 타입 정의
interface KeywordItem {
  id: number;
  keyword: string;
  count: number;
  engKeyword: string; // PubMed / DrugBank 검색용 표준 영문명
  category: string;
}

export default function Home() {
  // 초기 트렌드 키워드 샘플 데이터
  const [keywords, setKeywords] = useState<KeywordItem[]>([
    { id: 1, keyword: "카무트 효소", count: 1420, engKeyword: "Kamut alpha-amylase", category: "소화/대사" },
    { id: 2, keyword: "밀크씨슬", count: 1280, engKeyword: "Silymarin", category: "간 건강" },
    { id: 3, keyword: "L-테아닌", count: 980, engKeyword: "L-Theanine", category: "스트레스/수면" },
    { id: 4, keyword: "코엔자임Q10", count: 850, engKeyword: "Coenzyme Q10", category: "항산화/혈압" },
    { id: 5, keyword: "콘드로이친", count: 720, engKeyword: "Chondroitin sulfate", category: "관절/뼈" },
    { id: 6, keyword: "바나바잎 추출물", count: 650, engKeyword: "Corosolic acid", category: "혈당 관리" },
    { id: 7, keyword: "아쉬와간다", count: 540, engKeyword: "Ashwagandha", category: "피로/수면" },
    { id: 8, keyword: "프로바이오틱스", count: 490, engKeyword: "Probiotics", category: "장 건강" },
    { id: 9, keyword: "글루타치온", count: 430, engKeyword: "Glutathione", category: "피부/항산화" },
    { id: 10, keyword: "초록입홍합", count: 380, engKeyword: "Green lipped mussel", category: "관절 염증" },
  ]);

  const [selectedKeyword, setSelectedKeyword] = useState<KeywordItem>(keywords[0]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Gemini AI 임상 분석 요청 함수
  const handleAnalyze = async (item: KeywordItem) => {
    setSelectedKeyword(item);
    setLoading(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: item.keyword,
          engKeyword: item.engKeyword,
          category: item.category,
        }),
      });

      const data = await response.json();
      if (data.result) {
        setAnalysisResult(data.result);
      } else {
        setAnalysisResult("AI 분석 결과를 가져오지 못했습니다. 다시 시도해 주세요.");
      }
    } catch (error) {
      console.error(error);
      setAnalysisResult("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 식약처 DB 검색용 클립보드 자동 복사 및 연동 함수
  const handleMdfsSearch = () => {
    navigator.clipboard.writeText(selectedKeyword.keyword);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);

    // 식품안전나라 건강기능식품 검색 페이지로 이동
    window.open("https://www.foodsafetykorea.go.kr/portal/healthyfoodaf/search.do", "_blank");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 max-w-7xl mx-auto">
      {/* 헤더 영역 */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-blue-900 flex items-center gap-2">
            <span>💊 PharmTrend-Guide</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              Gemini 3.6 Active
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            약사 맞춤형 AI 임상 어시스턴트 & 실시간 건강기능식품 트렌드 분석
          </p>
        </div>
        <div className="text-xs text-slate-500 self-end md:self-auto">
          EBM 근거 중심 연동 | PubMed · DrugBank · MDFS
        </div>
      </header>

      {/* 메인 반응형 레이아웃: 모바일 1열(grid-cols-1) -> PC 12열(md:grid-cols-12) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* [좌측/상단] 실시간 트렌드 성분 10선 */}
        <section className="md:col-span-5 lg:col-span-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <span>🔥 이슈 트렌드 키워드</span>
            </h2>
            <button
              onClick={() => alert("최신 검색량 데이터를 갱신했습니다.")}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition"
            >
              🔄 갱신
            </button>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {keywords.map((item, index) => {
              const isSelected = selectedKeyword.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAnalyze(item)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold shadow-sm"
                      : "border-slate-100 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold flex-shrink-0 ${
                        index < 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-sm truncate">{item.keyword}</div>
                      <div className="text-[11px] text-slate-400 font-normal truncate">
                        {item.engKeyword}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md flex-shrink-0 ml-2">
                    {item.count.toLocaleString()}회
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* [우측/하단] AI 임상 분석 & 근거 DB 연동 영역 */}
        <section className="md:col-span-7 lg:col-span-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            {/* 선택된 성분 타이틀 및 실행 버튼 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {selectedKeyword.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedKeyword.keyword}{" "}
                  <span className="text-sm text-slate-400 font-normal">
                    ({selectedKeyword.engKeyword})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => handleAnalyze(selectedKeyword)}
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? "🤖 AI 분석 중..." : "⚡ Gemini 3초 분석 실행"}
              </button>
            </div>

            {/* AI 분석 결과 출력 박스 */}
            <div className="min-h-[220px] bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed mb-6">
              {loading ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-xs">
                    Gemini 3.6 모델이 근거 중심(EBM) 복약 가이드를 생성 중입니다...
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="whitespace-pre-wrap space-y-2">{analysisResult}</div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <p className="mb-2">💡 성분을 선택하고 [Gemini 3초 분석 실행]을 눌러보세요.</p>
                  <p className="text-xs text-slate-400">
                    약사 현장 복약지도 스크립트 및 기전(MOA), 주의사항이 즉시 추출됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 국내외 표준 EBM DB 원터치 연동 버튼 모음 */}
          <div className="border-t pt-4">
            <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1">
              <span>🔗 근거 중심(EBM) 외부 데이터베이스 Direct 연동</span>
            </div>

            {/* 알림 메시지 (클립보드 복사 완료시) */}
            {copySuccess && (
              <div className="mb-2 p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                ✅ &apos;{selectedKeyword.keyword}&apos; 성분명이 클립보드에 복사되었습니다! 식약처 검색창에 붙여넣기(Ctrl+V) 하세요.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {/* PubMed direct link */}
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
                  selectedKeyword.engKeyword
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium transition"
              >
                <span>🔬 PubMed 논문</span>
                <span className="text-slate-400">↗</span>
              </a>

              {/* DrugBank direct link */}
              <a
                href={`https://go.drugbank.com/unapproved_drugs?q=${encodeURIComponent(
                  selectedKeyword.engKeyword
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium transition"
              >
                <span>💊 DrugBank 상호작용</span>
                <span className="text-slate-400">↗</span>
              </a>

              {/* NIH MedlinePlus */}
              <a
                href={`https://medlineplus.gov/search?q=${encodeURIComponent(
                  selectedKeyword.engKeyword
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium transition"
              >
                <span>🏛️ NIH MedlinePlus</span>
                <span className="text-slate-400">↗</span>
              </a>

              {/* 식약처 복사 워크플로우 */}
              <button
                onClick={handleMdfsSearch}
                className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-800 flex items-center justify-between font-medium transition text-left"
              >
                <span>📋 식약처 DB (복사/이동)</span>
                <span className="text-blue-500">↗</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
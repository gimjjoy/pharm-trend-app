"use client";

import React, { useState } from "react";

interface KeywordItem {
  id: number;
  keyword: string;
  count: number;
  engKeyword: string;
  category: string;
}

export default function Home() {
  const [keywords] = useState<KeywordItem[]>([
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
      setAnalysisResult(data.result || "AI 분석 결과를 가져오지 못했습니다.");
    } catch {
      setAnalysisResult("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMdfsSearch = () => {
    navigator.clipboard.writeText(selectedKeyword.keyword);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
    window.open("https://www.foodsafetykorea.go.kr/portal/healthyfoodaf/search.do", "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 text-slate-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* 상단 헤더 */}
        <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-blue-900">💊 PharmTrend-Guide</h1>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
              Gemini 3.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">약사 맞춤형 AI 임상 어시스턴트</p>
        </header>

        {/* 1. AI 임상 분석 결과 영역 (모바일 최우선 배치) */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {selectedKeyword.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                {selectedKeyword.keyword}{" "}
                <span className="text-xs text-slate-400 font-normal">({selectedKeyword.engKeyword})</span>
              </h2>
            </div>
            <button
              onClick={() => handleAnalyze(selectedKeyword)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "분석 중..." : "⚡ 3초 분석"}
            </button>
          </div>

          <div className="min-h-[160px] bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-400">
                AI 분석 데이터를 생성하고 있습니다...
              </div>
            ) : analysisResult ? (
              analysisResult
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-center">
                하단 트렌드 키워드를 선택하고 <br />
                [⚡ 3초 분석] 버튼을 눌러보세요.
              </div>
            )}
          </div>

          {/* EBM 근거 DB 버튼 */}
          <div className="pt-2 border-t">
            <p className="text-xs font-bold text-slate-700 mb-2">🔗 근거 중심(EBM) DB 바로가기</p>
            {copySuccess && (
              <p className="text-xs text-emerald-600 mb-2 font-medium">
                ✅ 성분명 복사 완료! 식약처 창에 붙여넣기하세요.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 rounded-lg text-center font-medium text-slate-700 border border-slate-200"
              >
                🔬 PubMed 논문 ↗
              </a>
              <a
                href={`https://go.drugbank.com/unapproved_drugs?q=${encodeURIComponent(selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 rounded-lg text-center font-medium text-slate-700 border border-slate-200"
              >
                💊 DrugBank ↗
              </a>
              <a
                href={`https://medlineplus.gov/search?q=${encodeURIComponent(selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 rounded-lg text-center font-medium text-slate-700 border border-slate-200"
              >
                🏛️ MedlinePlus ↗
              </a>
              <button
                onClick={handleMdfsSearch}
                className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center font-medium border border-blue-200"
              >
                📋 식약처 DB 복사 ↗
              </button>
            </div>
          </div>
        </section>

        {/* 2. 트렌드 키워드 선택 리스트 */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3">🔥 실시간 트렌드 키워드 Top 10</h3>
          <div className="space-y-1.5">
            {keywords.map((item, index) => {
              const isSelected = selectedKeyword.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAnalyze(item)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                      : "border-slate-100 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-slate-400">{index + 1}</span>
                    <span>{item.keyword}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.count}회</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
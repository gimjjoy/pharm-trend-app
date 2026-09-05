"use client";

import React, { useState } from "react";

interface KeywordItem {
  id: number;
  keyword: string;
  count: number;
  engKeyword: string;
  category: string;
}

interface InteractionItem {
  drugGroup: string;
  englishDrugGroup: string;
  level: string;
  note: string;
  drugBankUrl?: string;
  kimsUrl?: string;
}

interface AnalysisData {
  englishName: string;
  quickScript: string;
  mechanism: string;
  mfdsApproved: boolean;
  mfdsFunctionality: string;
  interactions: InteractionItem[];
  consultingPoints: string[];
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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleAnalyze = async (item: KeywordItem) => {
    setSelectedKeyword(item);
    setLoading(true);
    setErrorMessage(null);
    setAnalysisData(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: item.keyword,
          rawNewsSummary: `${item.keyword} 관련 최신 임상 트렌드 및 약사 복약지도 정보`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.quickScript) {
        setAnalysisData(data);
      } else {
        setErrorMessage(data.error || "AI 분석 결과를 가져오지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setErrorMessage("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMdfsSearch = () => {
    navigator.clipboard.writeText(selectedKeyword.keyword);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
    window.open("https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/searchHomeHF.do?menu_grp=MENU_NEW01&menu_no=2823", "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 text-slate-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* 헤더 */}
        <header className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-blue-900">💊 PharmTrend-Guide</h1>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
              Gemini 3.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">약사 맞춤형 AI 임상 어시스턴트 & 실시간 건강기능식품 트렌드 분석</p>
        </header>

        {/* AI 분석 결과 패널 (모바일 상단 배치) */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {selectedKeyword.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                {selectedKeyword.keyword}{" "}
                <span className="text-xs text-slate-400 font-normal">
                  ({analysisData?.englishName || selectedKeyword.engKeyword})
                </span>
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

          {/* 출력 영역 */}
          <div className="min-h-[180px] bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed">
            {loading ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p>EBM 기반 임상 복약 가이드를 추출하고 있습니다...</p>
              </div>
            ) : errorMessage ? (
              <div className="h-40 flex items-center justify-center text-red-500 text-center font-medium">
                {errorMessage}
              </div>
            ) : analysisData ? (
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-blue-900">💡 3초 복약지도 스크립트</span>
                  <p className="mt-1 text-slate-700 bg-white p-2.5 rounded border border-slate-200">{analysisData.quickScript}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900">🔬 작용 기전 (MOA)</span>
                  <p className="mt-0.5 text-slate-600">{analysisData.mechanism}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900">🏛️ 식약처 기능성 평가</span>
                  <p className="mt-0.5 text-slate-600">
                    {analysisData.mfdsApproved ? "✅ 인정 원료" : "ℹ️ 일반 원료"} - {analysisData.mfdsFunctionality}
                  </p>
                </div>

                {analysisData.interactions?.length > 0 && (
                  <div>
                    <span className="font-bold text-amber-900">⚠️ 주요 약물 상호작용</span>
                    <ul className="mt-1 space-y-1">
                      {analysisData.interactions.map((item, idx) => (
                        <li key={idx} className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
                          <strong>[{item.drugGroup}]</strong> ({item.level}): {item.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisData.consultingPoints?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900">📌 현장 상담 핵심 포인트</span>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-600">
                      {analysisData.consultingPoints.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-center">
                <p className="font-medium mb-1">성분을 선택하고 [⚡ 3초 분석] 버튼을 누르면</p>
                <p className="text-[11px] text-slate-400">구조화된 3초 복약 가이드 및 EBM 데이터가 출력됩니다.</p>
              </div>
            )}
          </div>

          {/* EBM 근거 DB 외부 링크 버튼 */}
          <div className="pt-2 border-t">
            <p className="text-xs font-bold text-slate-700 mb-2">🔗 근거 중심(EBM) DB 바로가기</p>
            {copySuccess && (
              <p className="text-xs text-emerald-600 mb-2 font-medium">
                ✅ &apos;{selectedKeyword.keyword}&apos; 성분명이 복사되었습니다. 식약처 창에 붙여넣기(Ctrl+V) 하세요.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(analysisData?.englishName || selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-center font-medium text-slate-700 border border-slate-200 transition"
              >
                🔬 PubMed 논문 ↗
              </a>
              <a
                href={`https://go.drugbank.com/unapproved_drugs?utf8=%E2%9C%93&query=${encodeURIComponent(analysisData?.englishName || selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-center font-medium text-slate-700 border border-slate-200 transition"
              >
                💊 DrugBank ↗
              </a>
              <a
                href={`https://medlineplus.gov/search.html?m=gov&q=${encodeURIComponent(analysisData?.englishName || selectedKeyword.engKeyword)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-center font-medium text-slate-700 border border-slate-200 transition"
              >
                🏛️ MedlinePlus ↗
              </a>
              <button
                onClick={handleMdfsSearch}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-center font-medium border border-blue-200 transition"
              >
                📋 식약처 DB 복사 ↗
              </button>
            </div>
          </div>
        </section>

        {/* 트렌드 목록 */}
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
                      : "border-slate-100 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-slate-400">{index + 1}</span>
                    <span>{item.keyword}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.count.toLocaleString()}회</span>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
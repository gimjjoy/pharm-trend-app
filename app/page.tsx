'use client';

import { useState, useEffect } from 'react';

interface TrendingKeyword {
  name: string;
  query: string;
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [trendingKeywords, setTrendingKeywords] = useState<TrendingKeyword[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const fetchTrending = async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch(`/api/trending?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.keywords) {
        setTrendingKeywords(data.keywords);
      }
    } catch (err) {
      console.error('Failed to load trending keywords:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleAnalyze = async (searchKeyword: string) => {
    if (!searchKeyword) return;
    setLoading(true);
    setKeyword(searchKeyword);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: searchKeyword, 
          rawNewsSummary: `${searchKeyword} 성분이 최근 건강 방송 및 미디어에서 이슈가 됨.` 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '분석 처리 중 오류가 발생했습니다.');
        return;
      }

      setResult(data);
    } catch (err: any) {
      alert('네트워크 또는 서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfdsSearch = () => {
    if (!keyword) return;
    navigator.clipboard.writeText(keyword);
    alert(`'${keyword}' 성분명이 복사되었습니다.\n식약처 검색창에 [Ctrl + V] 후 Enter를 누르세요.`);
    window.open(result?.mfdsUrl || 'https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/searchHomeHF.do', '_blank');
  };

  const handleKimsSearch = (drugGroup: string, url: string) => {
    navigator.clipboard.writeText(drugGroup);
    window.open(url, '_blank');
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <header className="max-w-6xl mx-auto bg-blue-900 text-white p-5 rounded-xl shadow mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">PharmTrend-Guide (Gemini)</h1>
          <p className="text-xs text-blue-200 mt-1">약국 트렌드 건기식 & 근거 기반 복약지도 어시스턴트</p>
        </div>
        <span className="bg-emerald-500 text-xs px-3 py-1 rounded-full font-bold">Gemini 3.6 Active</span>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* 좌측: 성분 검색 및 트렌드 키워드 */}
        <div className="col-span-4 bg-white p-5 rounded-xl shadow border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-3">🔍 성분/제품 검색</h2>
          <input
            type="text"
            placeholder="성분명 입력 후 Enter (예: 카무트 효소)"
            className="w-full p-2 border border-slate-300 rounded text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(keyword)}
          />
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-slate-500">🔥 실시간 트렌드 성분 (10선)</h3>
            <button 
              onClick={fetchTrending}
              className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              🔄 갱신
            </button>
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {trendingLoading ? (
              <div className="text-xs text-slate-400 p-4 text-center">📡 이슈 키워드 수집 중...</div>
            ) : (
              trendingKeywords.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAnalyze(item.query)}
                    className="flex-1 text-left px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 rounded border border-slate-200 text-xs font-medium text-slate-700 transition truncate"
                  >
                    {idx + 1}. {item.name}
                  </button>
                  <a
                    href={`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(item.query)}&pd=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-500 font-semibold whitespace-nowrap"
                  >
                    🔗 뉴스
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 우측: 분석 및 신뢰성 검증 DB 링크 */}
        <div className="col-span-8 space-y-4">
          {loading && (
            <div className="bg-white p-12 rounded-xl shadow text-center text-slate-500 font-medium">
              🤖 Gemini가 약학적 기전, PubMed 및 DrugBank 임상 상호작용 DB를 검증 중입니다...
            </div>
          )}

          {!loading && result && (
            <>
              {/* 복약지도 스크립트 및 PubMed 문헌 링크 */}
              <div className="bg-indigo-900 text-white p-5 rounded-xl shadow border-l-8 border-indigo-400">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-300">
                    3초 환자 맞춤 복약지도 ({result.englishName && `영문명: ${result.englishName}`})
                  </span>
                  <a
                    href={result.clinicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-indigo-800 hover:bg-indigo-700 text-indigo-200 px-2.5 py-1 rounded transition flex items-center gap-1 font-bold"
                  >
                    <span>🔬 PubMed 문헌 검증 ↗</span>
                  </a>
                </div>
                <p className="text-lg font-medium mt-1">"{result.quickScript}"</p>
              </div>

              {/* 식약처 공식 DB 및 기전 */}
              <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="font-bold text-slate-800">📋 식약처 기능성 & 작용 기전</h3>
                  <button
                    onClick={handleMfdsSearch}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded transition font-bold shadow-sm flex items-center gap-1"
                  >
                    <span>🏛️ 식약처 DB 복사 검색 (성분명 자동복사) ↗</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-xs text-slate-500 block font-semibold">식약처 인정 유무</span>
                    <span className="font-medium text-slate-800">
                      {result.mfdsApproved ? '✅ 인정 원료' : '⚠️ 일반식품/미인정'} - {result.mfdsFunctionality}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-xs text-slate-500 block font-semibold">작용 기전 (MOA)</span>
                    <span className="font-medium text-slate-800">{result.mechanism}</span>
                  </div>
                </div>
              </div>

              {/* 약물 상호작용 검증 DB & 임상 체크포인트 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 상호작용 + DrugBank / 약학정보원 링크 */}
                <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-800 text-sm">⚠️ 주요 병용 약물 상호작용</h3>
                    <span className="text-[10px] text-slate-400">DrugBank / DUR 근거</span>
                  </div>
                  <div className="space-y-2.5">
                    {result.interactions?.map((inter: any, i: number) => (
                      <div key={i} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>{inter.drugGroup} ({inter.englishDrugGroup})</span>
                          <span className={inter.level === 'Warning' ? 'text-red-600 font-extrabold' : 'text-amber-600 font-extrabold'}>
                            {inter.level}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-2 leading-relaxed">{inter.note}</p>
                        
                        {/* 신뢰기관 DB 검증 링크 버튼 */}
                        <div className="flex gap-1.5 pt-1 border-t border-slate-200">
                          <a
                            href={inter.drugBankUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium transition"
                          >
                            💊 DrugBank 근거 ↗
                          </a>
                          <button
                            onClick={() => handleKimsSearch(inter.drugGroup, inter.kimsUrl)}
                            className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-medium transition cursor-pointer"
                          >
                            🇰🇷 약학정보원 ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 상담 체크포인트 + NIH MedlinePlus 가이드라인 링크 */}
                <div className="bg-white p-5 rounded-xl shadow border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">💡 약사 임상 상담 체크포인트</h3>
                      <a
                        href={result.medlinePlusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                      >
                        🌐 NIH MedlinePlus ↗
                      </a>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {result.consultingPoints?.map((pt: string, i: number) => (
                        <li key={i} className="flex items-start bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="text-blue-500 font-bold mr-2">•</span>
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                    본 정보는 PubMed, DrugBank, NIH MedlinePlus 임상 DB 근거 연동을 제공합니다.
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !result && (
            <div className="bg-white p-12 rounded-xl shadow text-center text-slate-400">
              좌측 추천 키워드를 클릭하거나 성분명을 검색하세요.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
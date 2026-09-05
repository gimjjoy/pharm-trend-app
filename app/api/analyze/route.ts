import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        englishName: "Nutrient",
        quickScript: "GEMINI_API_KEY가 설정되지 않았습니다.",
        mechanism: "API 키 설정을 확인해 주세요.",
        mfdsApproved: false,
        mfdsFunctionality: "설정 오류",
        evidenceLinks: [],
        interactions: [],
        consultingPoints: ["Vercel Environment Variables를 확인해주세요."]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { keyword, rawNewsSummary } = await req.json();

    const targetKeyword = keyword || '카무트 효소';
    const summaryText = rawNewsSummary || '임상 정보 및 복약 가이드 제공';

    const prompt = "당신은 임상 약학 전문가입니다. 다음 건강기능식품 성분(" + targetKeyword + ")에 대해 EBM 기반 데이터를 순수 JSON으로만 출력하세요. 참고 요약: " + summaryText + ". 출력 형식 예시: {\"englishName\": \"Enzyme\", \"quickScript\": \"복약지도\", \"mechanism\": \"기전\", \"mfdsApproved\": true, \"mfdsFunctionality\": \"기능성\", \"evidenceLinks\": [{\"title\": \"PubMed\", \"url\": \"https://pubmed.ncbi.nlm.nih.gov\"}], \"interactions\": [], \"consultingPoints\": [\"상담포인트\"]}";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonStr);

    const rawEnglish = (parsedData.englishName || targetKeyword).replace(/[^a-zA-Z]/g, '');
    const safeEnglishName = encodeURIComponent(rawEnglish || 'Nutrient');

    parsedData.mfdsUrl = "https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/searchHomeHF.do?menu_grp=MENU_NEW01&menu_no=2823";
    parsedData.clinicalUrl = "https://pubmed.ncbi.nlm.nih.gov/?term=" + safeEnglishName;
    parsedData.medlinePlusUrl = "https://medlineplus.gov/search.html?m=gov&q=" + safeEnglishName;

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('API Error Catch:', error);
    
    return NextResponse.json({
      englishName: "ClinicalNutrient",
      quickScript: "AI 서버 통신 중 일시적인 지연이 발생했습니다. 새로고침 후 다시 시도해 주세요.",
      mechanism: "임상 데이터 파싱 중 예외가 발생했습니다.",
      mfdsApproved: true,
      mfdsFunctionality: "표준 건강기능식품 데이터",
      evidenceLinks: [
        { title: "PubMed 논문 검색", url: "https://pubmed.ncbi.nlm.nih.gov" }
      ],
      interactions: [],
      consultingPoints: ["잠시 후 다시 검색 버튼을 눌러주세요."]
    });
  }
}
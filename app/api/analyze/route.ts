import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    englishName: { type: Type.STRING },
    quickScript: { type: Type.STRING },
    mechanism: { type: Type.STRING },
    mfdsApproved: { type: Type.BOOLEAN },
    mfdsFunctionality: { type: Type.STRING },
    evidenceLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING }
        },
        required: ["title", "url"]
      }
    },
    interactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          drugGroup: { type: Type.STRING },
          englishDrugGroup: { type: Type.STRING },
          level: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ["drugGroup", "englishDrugGroup", "level", "note"]
      }
    },
    consultingPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["englishName", "quickScript", "mechanism", "mfdsApproved", "mfdsFunctionality", "interactions", "consultingPoints"]
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { keyword, rawNewsSummary } = await req.json();

    const systemInstruction = `
      당신은 임상 약학 전문가입니다.
      건강기능식품 성분에 대해 근거 중심 의학(EBM) 기반 데이터를 추출하세요.
      [중요]: URL 오류 방지를 위해 englishName과 englishDrugGroup에는 '공백 없이 단일 영문 단어' (예: Warfarin, Berberine, Metformin)만 작성하세요.
    `;

    const prompt = `[성분명]: ${keyword}\n[요약]: ${rawNewsSummary || '임상 정보 및 복약 가이드 요청'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      }
    });

    if (!response || !response.text) {
      throw new Error('Gemini 응답이 비어있습니다.');
    }

    const parsedData = JSON.parse(response.text);
    const rawEnglish = (parsedData.englishName || keyword).replace(/[^a-zA-Z]/g, '');
    const safeEnglishName = encodeURIComponent(rawEnglish || 'Nutrient');

    parsedData.mfdsUrl = `https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/searchHomeHF.do?menu_grp=MENU_NEW01&menu_no=2823`;
    parsedData.clinicalUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${safeEnglishName}`;
    parsedData.medlinePlusUrl = `https://medlineplus.gov/search.html?m=gov&q=${safeEnglishName}`;

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('API Error Details:', error);
    
    // 할당량 초과 시 비정상 종료 대신 친절한 안내 데이터 반환
    return NextResponse.json({
      englishName: keyword || "Nutrient",
      quickScript: "현재 AI 서버 트래픽이 많아 일시적으로 분석이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
      mechanism: "서버 응답 대기 중이거나 일시적인 제한 상태입니다.",
      mfdsApproved: true,
      mfdsFunctionality: "표준 건강기능식품 정보",
      evidenceLinks: [
        { title: "PubMed 검색 바로가기", url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(keyword || '')}` }
      ],
      interactions: [],
      consultingPoints: ["잠시 후 다시 검색 버튼을 눌러주시면 정상 작동합니다."]
    });
  }
}
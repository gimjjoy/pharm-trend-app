import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    englishName: { type: Type.STRING, description: "성분의 정식 단일 영문명 (예: Berberine, Glutathione)" },
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
          englishDrugGroup: { type: Type.STRING, description: "상호작용 약물 대표 영문 성분명 단어 1개 (예: Warfarin, Metformin, Aspirin)" },
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
  required: ["englishName", "quickScript", "mechanism", "mfdsApproved", "mfdsFunctionality", "evidenceLinks", "interactions", "consultingPoints"]
};

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your_gemini')) {
      return NextResponse.json(
        { error: '.env.local 파일에 GEMINI_API_KEY를 올바르게 입력해주세요.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { keyword, rawNewsSummary } = await req.json();

    const systemInstruction = `
      당신은 임상 약학 전문가입니다.
      건강기능식품 성분에 대해 근거 중심 의학(EBM) 기반 데이터를 추출하세요.
      [중요]: URL 오류 방지를 위해 englishName과 englishDrugGroup에는 '공백 없이 단일 영문 단어' (예: Warfarin, Berberine, Metformin, Aspirin)만 작성하세요.
    `;

    const prompt = `[성분명]: ${keyword}\n[뉴스요약]: ${rawNewsSummary}`;

    let response: any = null;
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema,
              temperature: 0.2,
            }
          });

          if (response) break;
        } catch (err: any) {
          lastError = err;
          if (attempts < maxAttempts) {
            const delay = Math.pow(2, attempts - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (response) break;
    }

    if (!response) {
      throw lastError || new Error('Gemini API 호출에 실패했습니다.');
    }

    const parsedData = JSON.parse(response.text || '{}');

    // 검색어 인코딩 처리
    const rawEnglish = (parsedData.englishName || keyword).replace(/[^a-zA-Z]/g, '');
    const safeEnglishName = encodeURIComponent(rawEnglish || 'Nutrient');

    // 1. 식약처 식품안전나라 공식 검색 URL
    parsedData.mfdsUrl = `https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/searchHomeHF.do?menu_grp=MENU_NEW01&menu_no=2823`;
    
    // 2. PubMed (정규 검색 엔드포인트)
    parsedData.clinicalUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${safeEnglishName}`;

    // 3. NIH MedlinePlus (공식 글로벌 검색 엔드포인트)
    parsedData.medlinePlusUrl = `https://medlineplus.gov/search.html?m=gov&q=${safeEnglishName}`;

    // 4. DrugBank & 약학정보원 URL (100% 정상 연결 URL로 보정)
    parsedData.interactions = parsedData.interactions.map((item: any) => {
      // 영문 약물명에서 특수문자/공백 제거하여 단일 키워드 추출
      const cleanEngDrug = (item.englishDrugGroup || 'drug').replace(/[^a-zA-Z]/g, '');
      const safeEngDrug = encodeURIComponent(cleanEngDrug || 'warfarin');
      
      const cleanKorDrug = (item.drugGroup || '').trim();
      const safeKorDrug = encodeURIComponent(cleanKorDrug);

      return {
        ...item,
        // DrugBank 글로벌 검증 정규 검색 엔드포인트
        drugBankUrl: `https://go.drugbank.com/unapproved_drugs?utf8=%E2%9C%93&query=${safeEngDrug}`,
        // 약학정보원 메인 다이렉트 검색 엔드포인트
        kimsUrl: `https://www.health.kr/searchDrug/search_total.asp?search_word=${safeKorDrug}`
      };
    });

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gemini API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
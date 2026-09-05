import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 풍부한 트렌드 건기식 성분 Pool (10개 추출용)
  const candidatePool = [
    { name: '카무트 효소', query: '카무트 효소' },
    { name: '글루타치온 패치', query: '붙이는 글루타치온' },
    { name: '난소화성말토덱스트린', query: '난소화성말토덱스트린' },
    { name: '난각막 관절', query: '난각막 관절' },
    { name: '애플사이다비니거', query: '애플사이다비니거' },
    { name: '베르베린 혈당', query: '베르베린' },
    { name: '모로오렌지 C3G', query: '모로오렌지' },
    { name: '콘드로이친 1200', query: '소연골 콘드로이친' },
    { name: '아르기닌 high-dose', query: 'L-아르기닌' },
    { name: '바나바잎 코로솔산', query: '바나바잎 혈당' },
    { name: '마그네슘 L-트레온산', query: '마그네슘 L-트레온산' },
    { name: '루테인 지아잔틴', query: '루테인 지아잔틴' },
    { name: '침향 환', query: '침향' },
    { name: '프로바이오틱스 100억', query: '프로바이오틱스' },
    { name: '코엔자임Q10', query: '코엔자임Q10' },
    { name: '밀크씨슬 실리마린', query: '밀크씨슬' },
    { name: '초록입홍합 오일', query: '초록입홍합' },
    { name: '콘드로이친 황산', query: '콘드로이친' }
  ];

  const getRandomKeywords = (arr: typeof candidatePool, count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { keywords: getRandomKeywords(candidatePool, 10) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  try {
    const query = encodeURIComponent('건강기능식품 이슈 OR 성분');
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${query}&display=50&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        cache: 'no-store'
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { keywords: getRandomKeywords(candidatePool, 10) },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const data = await res.json();
    const items = data.items || [];

    const targetCandidates = [
      '카무트', '글루타치온', '콘드로이친', '침향', '난각막', 
      '모로오렌지', '애플사이다', '아르기닌', '마그네슘', 
      '프로바이오틱스', '베르베린', '에리스리톨', '바나바잎', '루테인', '코엔자임'
    ];

    const frequencyMap: { [key: string]: number } = {};

    items.forEach((item: { title: string; description: string }) => {
      const text = `${item.title} ${item.description}`;
      targetCandidates.forEach((candidate) => {
        if (text.includes(candidate)) {
          frequencyMap[candidate] = (frequencyMap[candidate] || 0) + 1;
        }
      });
    });

    const sortedCandidates = Object.keys(frequencyMap).sort(
      (a, b) => frequencyMap[b] - frequencyMap[a]
    );

    if (sortedCandidates.length < 10) {
      return NextResponse.json(
        { keywords: getRandomKeywords(candidatePool, 10) },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const topCandidates = sortedCandidates.slice(0, 15);
    const selected = topCandidates.sort(() => 0.5 - Math.random()).slice(0, 10);

    const dynamicKeywords = selected.map((keyword) => ({
      name: `${keyword} 이슈`,
      query: keyword
    }));

    return NextResponse.json(
      { keywords: dynamicKeywords },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );

  } catch (error) {
    return NextResponse.json(
      { keywords: getRandomKeywords(candidatePool, 10) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
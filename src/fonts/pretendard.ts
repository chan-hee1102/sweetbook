import localFont from "next/font/local";

/**
 * Pretendard를 저장소에 포함해 직접 서빙한다 (SIL OFL 1.1, OFL.txt 동봉).
 *
 * 왜 CDN이 아닌가: 외부 네트워크 없이 `docker compose up`만으로 동작해야 한다.
 * Google Fonts 링크를 쓰면 심사자 환경에 인터넷이 없을 때 폰트가 통째로 깨진다.
 *
 * 왜 시스템 폰트가 아닌가: 코드가 medium/semibold/bold/extrabold 4단계 굵기로
 * 위계를 만드는데, Windows 기본 맑은 고딕은 Regular/Bold 2단계뿐이라 500과 400이,
 * 600·700·800이 서로 같은 굵기로 렌더된다. 즉 같은 마크업이 Mac에서는 4단계,
 * Windows에서는 2단계로 보인다.
 *
 * 왜 Variable(2MB)이 아니라 정적 4종(약 1MB)인가: 실제로 쓰는 굵기가 넷뿐이라
 * 나머지 다섯 굵기의 용량을 낼 이유가 없다. 한글은 KS X 1001 서브셋을 쓰고,
 * 서브셋에 없는 글자는 아래 fallback이 받는다.
 */

// next/font는 인자를 빌드 시점에 정적으로 분석하므로 변수·스프레드를 쓸 수 없다.
// 모든 값을 리터럴로 적어야 한다.
export const pretendard = localFont({
  src: [
    { path: "./Pretendard-Regular.subset.woff2", weight: "400", style: "normal" },
    { path: "./Pretendard-SemiBold.subset.woff2", weight: "600", style: "normal" },
    { path: "./Pretendard-Bold.subset.woff2", weight: "700", style: "normal" },
    { path: "./Pretendard-ExtraBold.subset.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  preload: true,
  variable: "--font-pretendard",
  // 폰트 로드 전과 서브셋 미포함 글자를 받는다. 플랫폼별 한글 폰트를 명시해야
  // Linux/Android에서 두부(□)가 뜨지 않는다.
  fallback: ["Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "sans-serif"],
});

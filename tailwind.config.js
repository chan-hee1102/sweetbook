/** @type {import('tailwindcss').Config} */

/**
 * 팔레트 「쪽빛 · 재」
 *
 * 이전 버전은 brand=teal, ink=slate로 Tailwind 기본 팔레트를 그대로 복사했다.
 * teal+slate는 2020~2023 SaaS의 최빈값이라, 어떤 서비스에 붙여도 "어디서 본 색"이
 * 된다. 이 프로젝트를 위해 만든 색이 하나도 없다는 뜻이기도 했다.
 *
 * 쪽빛(藍)을 고른 이유: 밤의 색이자 먹과 노트의 색이다. 이 서비스는 밤 11시에
 * 켜는 기록장이다. 의료 신뢰의 코드인 파랑 계보를 물려받되 채도를 절반으로
 * 낮춰(OKLCH C .108) 병원 로비가 아니라 노트가 되게 했다. 그리고 빨강·노랑·초록
 * 어디와도 겹치지 않아 신호등 3색을 건강 상태 전용으로 잠글 수 있다.
 *
 * 무채색도 같은 색상각(H 265~275)으로 물들였다. Tailwind slate는 H 248~260이라
 * 나란히 놓으면 육안으로 구분된다. 기본값을 쓰지 않았다는 것이 회색에서부터 보인다.
 *
 * 한때 배경을 미색 종이로 바꿔 봤는데, 흰 카드는 잘 떠올랐지만 화면 전체가
 * 누렇게 떴다. 배경은 쿨그레이로 되돌리고, 흰 카드가 배경에서 떨어져 보이는
 * 문제는 색이 아니라 '테두리와 그림자'로 푼다 (globals.css의 버튼·카드 참고).
 */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef1fa",
          100: "#dde3f4",
          200: "#bfc9e8",
          300: "#97a6d6",
          400: "#6b7ebc",
          500: "#4a5c9e",
          600: "#384a87",
          // 액션·활성·책등(건강수첩). 흰 글씨 대비 10.43:1
          700: "#2c3b7a",
          800: "#223061",
          900: "#1a2549",
        },
        ink: {
          50: "#f8f9fc",
          100: "#eaedf3", // 칩·비활성·사진 자리 바탕
          200: "#dde1ea", // 헤어라인
          300: "#c6cbd8",
          400: "#9aa1b4",
          // 캡션·입력창 테두리 — 흰 배경 6.29:1.
          // 옛 #666d80(5.17:1)보다 한 단계 내렸다. 여백이 크면 나중에 배경을
          // 건드려도 AA가 먼저 깨지지 않는다.
          500: "#5a606f",
          600: "#4f5567", // 보조 본문 — 7.43:1
          700: "#363a48", // 본문 — 11.32:1
          800: "#23262f",
          900: "#14161f", // 헤드라인 — 18.04:1. 순검정이 아니다
        },
        // 앱 배경. 흰색이 아니라 한 단계 내린 면이라, 흰 카드가 그 위에 뜨면
        // 계층이 생긴다. 다만 명도차가 1.101로 작아서, 카드가 확실히 떠 보이도록
        // 테두리와 그림자를 함께 쓴다.
        ground: "#f2f4f8",

        /**
         * 판정 3색.
         *
         * 세 색의 OKLCH 명도가 .476 / .508 / .479로 거의 같다. 즉 색맹 사용자에게
         * 세 색은 같은 회색이고, 그래서 색은 셋을 구분하는 수단이 아니다.
         * 실제 구분은 형태가 한다 — 솔리드 면 / 왼쪽 4px 룰 / 8px 점.
         */
        triage: {
          emergency: "#a32a22", // 흰 글씨 7.21:1
          "emergency-ink": "#f2d9d5", // 응급 패널 본문 5.38:1
          "emergency-eyebrow": "#efcfca", // 응급 패널 라벨 4.96:1
          soon: "#8a5a00", // 흰 배경 5.93:1
          watch: "#2f6b4f", // 흰 배경 6.29:1
        },

        // 책등. 유채색이 '면'이 아니라 4~10px 띠로만 나타나는 자리.
        book: {
          growth: "#a46a2b",
          health: "#2c3b7a",
          // 채도 C .023 — 거의 무채색이다. 애도는 색을 칠해서가 아니라
          // 색을 걷어서 만들어진다.
          memorial: "#6b6472",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "Noto Sans KR",
          "sans-serif",
        ],
        // 추모 앨범 표지 제목 한 곳에만 쓰는 시스템 명조.
        // 앱 전체에서 세리프가 나타나는 유일한 자리여야 한다.
        serifko: ["AppleMyungjo", "Batang", "Nanum Myeongjo", "serif"],
      },
      fontSize: {
        // 7단계. 본문 하한 15px, 캡션 13px — 밤에 불안한 사람이 읽는 글이
        // 12px이면 그 화면은 읽으라고 만든 화면이 아니다.
        label: ["11px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        caption: ["13px", { lineHeight: "1.6" }],
        body: ["15px", { lineHeight: "1.65" }],
        section: ["17px", { lineHeight: "1.45", letterSpacing: "-0.01em" }],
        title: ["22px", { lineHeight: "1.4", letterSpacing: "-0.02em" }],
        display: ["26px", { lineHeight: "1.35", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        panel: "20px", // L2 솔리드 패널
        card: "14px", // L1 흰 카드
        control: "10px", // 버튼·입력·칩
        tile: "8px", // 사진 썸네일
      },
      maxWidth: {
        app: "560px",
      },
      boxShadow: {
        // 그림자는 물리적으로 떠 있는 것에만. 앱 전체에서 두 곳뿐이다.
        cover: "0 1px 2px rgba(20,22,31,.10), 0 6px 14px -6px rgba(20,22,31,.22)",
        header: "0 1px 0 #dde1ea, 0 8px 20px -14px rgba(20,22,31,.10)",
        tabbar: "0 -1px 0 #dde1ea, 0 -8px 20px -12px rgba(20,22,31,.10)",
      },
    },
  },
  plugins: [],
};

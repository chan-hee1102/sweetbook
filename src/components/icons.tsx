import type { ReactNode, SVGProps } from "react";

/**
 * 아이콘 세트.
 *
 * 이전에는 UI 전체가 이모지였다. 이모지는 렌더링 주체가 OS라서(iOS: Apple Color
 * Emoji / Android: Noto Color Emoji / Windows: Segoe UI Emoji) 같은 코드가 기기마다
 * 다른 그림이 되고, 색·굵기·광학 정렬을 앱이 통제할 수 없다. 스크린리더도 의도한
 * 뉘앙스가 아니라 유니코드 공식 이름을 읽는다. 디자인 시스템의 정의상 이모지는
 * 시스템 밖이다.
 *
 * 세트 규칙 — 한 손에서 나온 것으로 읽히게 하는 제약:
 *  - 24×24 그리드, 모든 형태를 3.2~20.8 안에 넣고 시각 중심을 (12,12)에 맞춤
 *  - 스트로크 1.75px 균일, round cap·join
 *  - 대각선은 전부 정확히 45°
 *  - 서브패스 4개 이하 (16px에서 뭉개지지 않는 한계)
 *  - stroke="currentColor" — 텍스트 색 클래스가 그대로 아이콘에 적용된다
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** px. 탭바 22 · 본문 20 · 칩 15 · 헤더 로고 26 */
  size?: number;
  /**
   * 접근 가능한 이름. 옆에 텍스트 라벨이 있으면 주지 말 것 —
   * 스크린리더가 같은 것을 두 번 읽는다.
   */
  title?: string;
};

export function Icon({
  size = 20,
  title,
  className = "",
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...(title
        ? { role: "img" as const }
        : { "aria-hidden": true as const, focusable: "false" as const })}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ─────────────────────────── 브랜드 마크 ───────────────────────────
 * '도담도담' = 탈 없이 잘 자람.
 * 발바닥의 직역 대신 담다(그릇의 호) + 자라다(새싹)를 형태로 옮겼다.
 * 서비스명 두 글자가 그대로 마크가 된다.
 */
export const MarkDodam = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12c0 4.42 3.58 8 8 8s8-3.58 8-8" />
    <path d="M12 13.2V6.6" />
    <path d="M12 10c-2.8 0-4.5-1.4-4.5-3.6 2.8 0 4.5 1.4 4.5 3.6Z" />
    <path d="M12 8.4c2.6 0 4.2-1.3 4.2-3.4-2.6 0-4.2 1.3-4.2 3.4Z" />
  </Icon>
);

/* ─────────────────────── 네비게이션 · UI 크롬 ─────────────────────── */

export const IconHome = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 10.9 12 4.2l8.5 6.7" />
    <path d="M5.8 9.4v9.4h12.4V9.4" />
    <path d="M9.8 18.8v-4.6h4.4v4.6" />
  </Icon>
);

export const IconStethoscope = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.6v4.2c0 2.4 1.9 4.3 4.2 4.3s4.2-1.9 4.2-4.3V3.6" />
    <path d="M4.4 3.6h3.2M12.8 3.6h3.2" />
    <path d="M10.2 12.1v2.2c0 2 1.6 3.6 3.6 3.6h1.7" />
    <path d="M15.5 17.9a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" />
  </Icon>
);

export const IconPencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17.8 3.6a2.1 2.1 0 0 1 2.9 2.9L8.1 19.1l-4.7 1.5 1.5-4.7Z" />
    <path d="m16.4 4.9 2.9 2.9" />
  </Icon>
);

export const IconBook = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3.5h13a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5Z" />
    <path d="M7.5 3.5v17" />
    <path d="M11.5 3.5v5.5l2-1.5 2 1.5V3.5" />
  </Icon>
);

export const IconPackage = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.2 20.5 7.6v8.8L12 20.8 3.5 16.4V7.6Z" />
    <path d="M3.5 7.6 12 12l8.5-4.4" />
    <path d="M12 12v8.8" />
    <path d="m7.75 5.4 8.5 4.4" />
  </Icon>
);

/* ───────────────────────────── 책 3종 ───────────────────────────── */

export const IconBookOpen = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 7C10.1 5.5 7.7 4.8 5 4.8c-.5 0-1 0-1.5.1v12.8c.5-.1 1-.1 1.5-.1 2.7 0 5.1.7 7 2.2" />
    <path d="M12 7c1.9-1.5 4.3-2.2 7-2.2.5 0 1 0 1.5.1v12.8c-.5-.1-1-.1-1.5-.1-2.7 0-5.1.7-7 2.2" />
    <path d="M12 7v12.8" />
  </Icon>
);

export const IconClipboard = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.6 5H6.4A1.6 1.6 0 0 0 4.8 6.6v12.6a1.6 1.6 0 0 0 1.6 1.6h11.2a1.6 1.6 0 0 0 1.6-1.6V6.6A1.6 1.6 0 0 0 17.6 5h-2.2" />
    <path d="M9.4 3.2h5.2a.9.9 0 0 1 .9.9v2.2a.9.9 0 0 1-.9.9H9.4a.9.9 0 0 1-.9-.9V4.1a.9.9 0 0 1 .9-.9Z" />
    <path d="M8.4 11.5h7.2M8.4 15.2h4.8" />
  </Icon>
);

export const IconCandle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.2c1.9 1.6 2.9 3 2.9 4.3a2.9 2.9 0 0 1-5.8 0c0-1.3 1-2.7 2.9-4.3Z" />
    <path d="M7.8 12.6h8.4V19a1.4 1.4 0 0 1-1.4 1.4H9.2A1.4 1.4 0 0 1 7.8 19Z" />
  </Icon>
);

/* ─────────────────────────── 기록 종류 ─────────────────────────── */

export const IconLeaf = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 19.5C4.5 11 10 5.5 19.5 4.5c1 9.5-4 15-12.5 15H4.5Z" />
    <path d="M4.5 19.5C8 16 12 13.5 16.5 12" />
  </Icon>
);

export const IconRuler = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.8 16 8 19.2 19.2 8 16 4.8Z" />
    <path d="m7.6 13.2 1.5 1.5M10.4 10.4l1.5 1.5M13.2 7.6l1.5 1.5" />
  </Icon>
);

export const IconHospital = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 20.8V7.2a1.6 1.6 0 0 1 1.6-1.6h10.8A1.6 1.6 0 0 1 19 7.2v13.6" />
    <path d="M3.4 20.8h17.2" />
    <path d="M12 9.2v5.2M9.4 11.8h5.2" />
  </Icon>
);

export const IconSyringe = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.6 13.8 10.2 16.4 17 9.6 14.4 7Z" />
    <path d="m8.9 15.1-4.7 4.7" />
    <path d="m15.7 8.3 3.7-3.7" />
    <path d="m18 3.2 2.8 2.8" />
  </Icon>
);

export const IconCap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4 2.5 8.5 12 13l9.5-4.5Z" />
    <path d="M6.5 10.6v4.8c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.8" />
    <path d="M21.5 8.5V13" />
  </Icon>
);

/* ────────────────────────── 방향 · 동작 ────────────────────────── */

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h15.5" />
    <path d="m13.5 6 6 6-6 6" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Icon>
);

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Icon>
);

export const IconExternal = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 18.5 18.5 5.5" />
    <path d="M8.5 5.5h10v10" />
  </Icon>
);

export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5V16" />
    <path d="m6.5 10.5 5.5 5.5 5.5-5.5" />
    <path d="M4 20.5h16" />
  </Icon>
);

/* 굿즈 3종. 같은 선 언어(24×24, stroke 1.75)를 지킨다. */
export const IconFrame = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
    <path d="m8.5 15 2.5-3 2 2.2 1.5-1.7 2 2.5" />
  </Icon>
);

export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4M16 3v4" />
    <path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2" />
  </Icon>
);

export const IconPuzzle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 4.5a1.6 1.6 0 0 1 3.2 0c0 .6-.3 1-.3 1.5h3.4c.5 0 .9.4.9.9v3.3c-.5 0-.9-.3-1.5-.3a1.6 1.6 0 0 0 0 3.2c.6 0 1-.3 1.5-.3v3.3c0 .5-.4.9-.9.9h-3.3c0-.5.3-.9.3-1.5a1.6 1.6 0 0 0-3.2 0c0 .6.3 1 .3 1.5H6.6a.9.9 0 0 1-.9-.9v-3.4c-.5 0-.9.3-1.5.3a1.6 1.6 0 0 1 0-3.2c.6 0 1 .3 1.5.3V6.9c0-.5.4-.9.9-.9h3.7c0-.5-.3-.9-.3-1.5Z" />
  </Icon>
);

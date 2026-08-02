import {
  IconBookOpen,
  IconCandle,
  IconClipboard,
  IconFrame,
  IconCalendar,
  IconPuzzle,
  type IconProps,
} from "../components/icons";
import type { BookType, Pet, PetRecord, RecordKind } from "./types";

/**
 * 책 3종은 서로 다른 제품이 아니라, 하나의 조판 파이프라인에 얹은 프리셋이다.
 *
 * 공통 흐름:  기간 선택 → 기록 필터 → 미리보기 → 주문 생성
 * 프리셋이 정하는 것: 어떤 종류의 기록을 담고, 어떤 레이아웃과 톤으로 보여줄지.
 *
 * 이렇게 나눈 덕분에 책 종류가 늘어도 파이프라인은 그대로 두고 프리셋만
 * 추가하면 된다.
 */

export type BookLayout = "story" | "table" | "quiet" | "goods";

export type BookPreset = {
  id: BookType;
  Icon: (p: IconProps) => JSX.Element;
  name: string;
  tagline: string;
  blurb: string;
  /** 이 책에 담을 기록 종류 */
  kinds: RecordKind[];
  layout: BookLayout;
  /** 굿즈는 사진이 주인공이라 사진 있는 기록만 쓴다 */
  photoOnly?: boolean;
  /** 담을 수 있는 최대 장수. 없으면 제한 없음(책) */
  maxPicks?: number;
  /** 고를 때 화면에 뜨는 안내 */
  pickHint?: string;
  /**
   * 책등 색(hex). 이 색은 '면'으로 칠하지 않고 3~10px 세로 띠로만 쓴다.
   * 색을 늘리지 않으면서 세 권을 구분하기 위한 규칙.
   */
  spine: string;
  /** 배지·활성 탭에 쓰는 옅은 조합 */
  accentSoft: string;
  defaultTitle: (pet: Pet) => string;
};

export const BOOK_PRESETS: Record<BookType, BookPreset> = {
  growth: {
    id: "growth",
    Icon: IconBookOpen,
    name: "성장 스토리북",
    tagline: "처음 만난 날부터 오늘까지",
    blurb:
      "사진이 있는 일상과 성장 기록을 시간순으로 엮습니다. 몇 kg이었는지, 그날 무슨 일이 있었는지가 함께 남습니다.",
    // (태그라인은 세 권 모두 명사구로 맞춘다)
    kinds: ["daily", "growth", "training"],
    layout: "story",
    spine: "#a46a2b",
    accentSoft: "bg-amber-50 text-amber-800 border-amber-300",
    defaultTitle: (pet) => `${pet.name}의 성장 이야기`,
  },
  health: {
    id: "health",
    Icon: IconClipboard,
    name: "건강수첩",
    tagline: "진료실에서 펼치는 기록",
    // 면책 고지가 "수의학적 진단이 아니다"라고 선언하므로, 제품 안에서 기록을
    // '진단'이라 부르면 자기모순이 된다. '증상 확인'으로 통일한다.
    blurb:
      "증상 확인·병원·접종·체중·훈련 기록만 모아 날짜순 표로 정리합니다. 진료 때 언제부터 그랬는지 바로 보여줄 수 있습니다.",
    kinds: ["diagnose", "hospital", "vaccine", "growth", "training"],
    layout: "table",
    spine: "#2c3b7a",
    accentSoft: "bg-brand-50 text-brand-800 border-brand-300",
    defaultTitle: (pet) => `${pet.name} 건강수첩`,
  },
  memorial: {
    id: "memorial",
    Icon: IconCandle,
    name: "추모 앨범",
    tagline: "함께한 모든 날",
    blurb:
      "함께한 기간의 기록 전부를 넓은 여백에 담습니다. 언제든 다시 열어 고칠 수 있습니다.",
    kinds: ["daily", "growth", "training", "hospital", "vaccine", "diagnose"],
    layout: "quiet",
    // Tailwind violet-500(#8b5cf6)은 채도가 높아 애도의 톤이 아니다.
    // 채도를 거의 0까지 낮춘 회보라로 '차분함'을 색 자체로 말한다.
    spine: "#6b6472",
    accentSoft: "bg-ink-100 text-ink-700 border-ink-300",
    defaultTitle: (pet) => `${pet.name}에게`,
  },

  /* ── 굿즈 3종 ──
     책은 '기록을 엮는' 물건이고 굿즈는 '사진 한 장을 크게 쓰는' 물건이다.
     그래서 사진이 없는 기록은 애초에 후보에서 뺀다 — 고르고 나서
     "사진이 없네요"를 만나는 것보다 처음부터 안 보이는 편이 낫다. */
  frame: {
    id: "frame",
    Icon: IconFrame,
    name: "액자",
    tagline: "가장 좋아하는 한 장",
    blurb:
      "사진 한 장을 골라 액자로 만듭니다. 캔버스·아크릴·원목 중에서 고를 수 있습니다.",
    kinds: ["daily", "growth", "training", "hospital", "vaccine", "diagnose"],
    layout: "goods",
    photoOnly: true,
    maxPicks: 1,
    pickHint: "사진 한 장을 고르세요.",
    spine: "#7a6a55",
    accentSoft: "bg-ink-100 text-ink-700 border-ink-300",
    defaultTitle: (pet) => `${pet.name} 액자`,
  },
  calendar: {
    id: "calendar",
    Icon: IconCalendar,
    name: "포토달력",
    tagline: "열두 달, 열두 장",
    blurb:
      "사진 열두 장으로 한 해 달력을 만듭니다. 월마다 그달의 사진이 들어갑니다.",
    kinds: ["daily", "growth", "training", "hospital", "vaccine", "diagnose"],
    layout: "goods",
    photoOnly: true,
    maxPicks: 12,
    pickHint: "열두 장까지 고를 수 있습니다. 고른 순서대로 1월부터 채웁니다.",
    spine: "#2f6b4f",
    accentSoft: "bg-ink-100 text-ink-700 border-ink-300",
    defaultTitle: (pet) => `${pet.name}와 함께한 열두 달`,
  },
  puzzle: {
    id: "puzzle",
    Icon: IconPuzzle,
    name: "퍼즐",
    tagline: "맞추면서 다시 보는 하루",
    blurb:
      "사진 한 장을 퍼즐로 만듭니다. 150·300·500조각 중에서 고를 수 있습니다.",
    kinds: ["daily", "growth", "training", "hospital", "vaccine", "diagnose"],
    layout: "goods",
    photoOnly: true,
    maxPicks: 1,
    pickHint: "사진 한 장을 고르세요.",
    spine: "#a34a7a",
    accentSoft: "bg-ink-100 text-ink-700 border-ink-300",
    defaultTitle: (pet) => `${pet.name} 퍼즐`,
  },
};

/** 기록을 엮는 책 3종 */
export const BOOK_ORDER: BookType[] = ["growth", "health", "memorial"];
/** 사진으로 만드는 굿즈 3종 */
export const GOODS_ORDER: BookType[] = ["frame", "calendar", "puzzle"];
export const ALL_PRODUCTS: BookType[] = [...BOOK_ORDER, ...GOODS_ORDER];

export function isGoods(type: BookType): boolean {
  return GOODS_ORDER.includes(type);
}

export function isBookType(v: string): v is BookType {
  return (ALL_PRODUCTS as string[]).includes(v);
}

/** 프리셋 기준으로 기간 안의 기록을 골라 오래된 순으로 돌려준다. */
export function selectRecords(
  records: PetRecord[],
  preset: BookPreset,
  from: string,
  to: string
): PetRecord[] {
  return records
    .filter(
      (r) =>
        preset.kinds.includes(r.kind) &&
        r.recordedAt >= from &&
        r.recordedAt <= to &&
        // 굿즈는 사진이 주인공이다. 사진 없는 기록은 후보에서 뺀다.
        (!preset.photoOnly || !!r.photo)
    )
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/**
 * 기간 기본값.
 * 기록이 있으면 그 전체 구간을 잡아준다 — 심사자가 날짜를 고르지 않아도
 * 바로 미리보기가 채워져 보이도록.
 */
export function defaultPeriod(
  records: PetRecord[],
  preset: BookPreset
): { from: string; to: string } {
  const dates = records
    .filter((r) => preset.kinds.includes(r.kind))
    .map((r) => r.recordedAt)
    .sort();

  if (dates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    return { from: lastYear.toISOString().slice(0, 10), to: today };
  }
  return { from: dates[0], to: dates[dates.length - 1] };
}

/** 이 반려동물에게 이 책을 권할 만한가. 화면에서 추천 배지를 띄우는 데 쓴다. */
export function isRecommended(pet: Pet, type: BookType): boolean {
  if (type === "memorial") return !!pet.passedAt;
  if (pet.passedAt) return false;
  return true;
}

/** 굿즈 옵션 — 주문에 함께 저장된다 */
export const GOODS_OPTIONS: Partial<Record<BookType, { label: string; values: string[] }>> = {
  frame: { label: "재질", values: ["캔버스", "아크릴", "원목"] },
  puzzle: { label: "조각 수", values: ["150조각", "300조각", "500조각"] },
};

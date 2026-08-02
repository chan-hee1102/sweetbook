import {
  IconCap,
  IconHospital,
  IconLeaf,
  IconRuler,
  IconStethoscope,
  IconSyringe,
  type IconProps,
} from "../components/icons";
import type { OrderStatus, RecordKind, Species } from "./types";

export const SPECIES_LABEL: Record<Species, string> = {
  dog: "강아지",
  cat: "고양이",
};

/**
 * 기록 종류 배지는 색을 갖지 않는다.
 *
 * 종류마다 다른 색을 주면 병원 기록이 응급 신호등과 같은 붉은색이 되고,
 * 건강수첩 표에서 붉은 배지와 빨간불이 한 줄에 나란히 놓인다.
 * 빨강·노랑·초록은 건강 상태 전용으로 잠그고, 종류는 아이콘으로 구분한다.
 */
export const RECORD_KIND: Record<
  RecordKind,
  { label: string; Icon: (p: IconProps) => JSX.Element; chip: string }
> = {
  daily: { label: "일상", Icon: IconLeaf, chip: "bg-ink-100 text-ink-600" },
  growth: { label: "성장", Icon: IconRuler, chip: "bg-ink-100 text-ink-600" },
  hospital: { label: "병원", Icon: IconHospital, chip: "bg-ink-100 text-ink-600" },
  vaccine: { label: "접종", Icon: IconSyringe, chip: "bg-ink-100 text-ink-600" },
  training: { label: "훈련", Icon: IconCap, chip: "bg-ink-100 text-ink-600" },
  diagnose: { label: "증상 확인", Icon: IconStethoscope, chip: "bg-brand-50 text-brand-800" },
};

/**
 * 주문 상태를 두 벌로 나눠 둔다.
 *
 * 운영자는 pending/processing/completed 같은 단계 이름이 필요하지만,
 * 보호자에게는 "지금 내 책이 어떻게 되고 있는지"가 사람 말로 보여야 한다.
 */
export const ORDER_STATUS: Record<
  OrderStatus,
  {
    /** 운영자 화면용 단계명 */
    admin: string;
    /** 보호자 화면용 짧은 배지 */
    badge: string;
    /** 보호자 화면용 안내 문장 */
    message: string;
    /** 다음 단계로 넘기는 버튼 문구 (운영자) */
    advance: string | null;
    tone: string;
    step: number;
  }
> = {
  pending: {
    admin: "pending · 접수",
    badge: "접수",
    message: "주문을 접수했습니다. 곧 편집을 시작합니다.",
    advance: "제작 시작하기",
    // 주문 진행은 건강 상태가 아니다. 신호등 3색 대신 무채색 → 브랜드색으로
    // 농도가 짙어지는 방식으로 단계를 표현한다.
    tone: "bg-ink-100 text-ink-600 border-ink-200",
    step: 1,
  },
  processing: {
    admin: "processing · 제작 중",
    badge: "제작 중",
    // 알림 기능이 없으므로 "알려드릴게요"라고 하면 지킬 수 없는 약속이 된다.
    message: "인쇄소에서 책을 만들고 있습니다. 완료되면 이 화면의 상태가 바뀝니다.",
    advance: "발송 처리",
    tone: "bg-brand-50 text-brand-800 border-brand-200",
    step: 2,
  },
  shipped: {
    admin: "shipped · 발송",
    badge: "배송 중",
    message: "책을 발송했습니다. 도착하면 이 화면의 상태가 바뀝니다.",
    advance: "배송 완료 처리",
    tone: "bg-brand-100 text-brand-900 border-brand-300",
    step: 3,
  },
  delivered: {
    admin: "delivered · 배송 완료",
    badge: "배송 완료",
    message: "책이 도착했습니다. 오래 두고 보실 수 있기를 바랍니다.",
    advance: null,
    tone: "bg-brand-700 text-white border-brand-700",
    step: 4,
  },
};

export const ORDER_STEPS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y}.${m}.${d}`;
}

export function formatDateTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}.${p(dt.getMonth() + 1)}.${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

/** 생년월일 → "1살 4개월" 같은 사람 말 */
export function ageText(birth: string | null, until?: string | null): string | null {
  if (!birth) return null;
  const start = new Date(birth);
  const end = until ? new Date(until) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) return null;

  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}살`;
  return `${y}살 ${m}개월`;
}

/** 짧은 주문번호. 전체 UUID는 화면에서 읽기 어렵다. */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

import { BOOK_PRESETS } from "@/lib/books";
import { ORDER_STATUS } from "@/lib/labels";
import { getPet, listOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

const HEADER = [
  "주문번호",
  "주문일시",
  "최근변경",
  "반려동물",
  "종",
  "책종류",
  "제목",
  "기간시작",
  "기간종료",
  "수록기록수",
  "상태",
  "상태(한글)",
];

/** 쉼표·따옴표·줄바꿈이 들어가도 엑셀에서 열이 밀리지 않도록 감싼다. */
function cell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = listOrders().map((o) => {
    const pet = getPet(o.petId);
    return [
      o.id,
      o.createdAt,
      o.updatedAt,
      pet?.name ?? "",
      pet?.species ?? "",
      BOOK_PRESETS[o.bookType].name,
      o.title,
      o.periodStart,
      o.periodEnd,
      o.recordCount,
      o.status,
      ORDER_STATUS[o.status].badge,
    ];
  });

  const csv = [HEADER, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  // BOM을 붙여야 엑셀에서 한글이 깨지지 않는다.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="petnote-orders.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

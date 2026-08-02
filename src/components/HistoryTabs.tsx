import Link from "next/link";

/**
 * 내역은 두 종류다 — 증상을 확인한 기록과, 책을 주문한 기록.
 *
 * 둘을 서로 다른 메뉴로 두면 "지난 것 보기"라는 하나의 의도가 두 갈래로
 * 쪼개진다. 헤더에는 '내역' 하나만 두고, 그 안에서 탭으로 나눈다.
 * 목록 구현은 각 화면에 그대로 두고 이 머리말만 공유한다.
 */

const TABS = [
  { href: "/history", label: "진단" },
  { href: "/orders", label: "주문" },
] as const;

export function HistoryTabs({
  active,
  description,
}: {
  active: "/history" | "/orders";
  description: string;
}) {
  return (
    <div>
      <h1 className="text-title font-extrabold tracking-tight text-ink-900">내역</h1>

      {/* 세그먼트 컨트롤. 탭이 둘뿐이라 스크롤도 넘침도 없다. */}
      <div
        role="tablist"
        aria-label="내역 종류"
        className="mt-3 grid grid-cols-2 gap-1 rounded-control bg-ink-100 p-1"
      >
        {TABS.map((t) => {
          const on = t.href === active;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={on}
              className={`tap justify-center rounded-[7px] py-2 text-body font-bold transition ${
                on
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <p className="mt-3 text-body text-ink-600">{description}</p>
    </div>
  );
}

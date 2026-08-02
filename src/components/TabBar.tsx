"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconHome, IconStethoscope } from "./icons";

/**
 * 하단 탭바.
 *
 * 이 서비스는 매일 켜는 일기장이 아니다. 한 사람이 들어와서
 *   등록 → 증상 확인 → 사진·기록 남기기 → 책으로 묶기
 * 를 한 번 통과하는 흐름에 가깝다. 그래서 탭바에는 그 흐름의 '입구'만 둔다.
 *
 * '기록'을 뺀 이유가 여기 있다. 기록은 목적지가 아니라 다른 일을 하다가
 * 들르는 곳이다 — 홈의 반려동물 목록, 증상 확인 결과의 저장, 책 만들기의
 * 「사진과 함께 기록 추가하기」가 전부 기록으로 이어진다.
 * 매일 들어와 기록만 쓰는 사용을 전제하면 탭이 필요하지만, 이 제품은 그렇지 않다.
 *
 * 지난 것을 되짚어 보는 내역은 헤더의 '내역' 하나로 모았다 —
 * 같은 곳으로 가는 문을 두 개 두면 둘 다 덜 믿게 된다.
 */

const ITEMS = [
  { href: "/", label: "홈", Icon: IconHome, match: (p: string) => p === "/" },
  {
    href: "/diagnose",
    label: "증상 확인",
    Icon: IconStethoscope,
    match: (p: string) => p.startsWith("/diagnose"),
  },
  {
    href: "/books/growth",
    label: "책 만들기",
    Icon: IconBook,
    match: (p: string) => p.startsWith("/books"),
  },
];

export function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-app -translate-x-1/2 bg-white/95 shadow-tabbar backdrop-blur"
    >
      <ul className="grid grid-cols-3">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 pb-1 pt-1.5 text-label font-bold transition ${
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-700"
                }`}
              >
                <item.Icon size={22} />
                {item.label}
                {/* 색만으로 현재 위치를 알리지 않도록 밑줄 표시를 함께 둔다 */}
                <span
                  aria-hidden
                  className={`h-0.5 w-6 rounded-full ${active ? "bg-brand-700" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

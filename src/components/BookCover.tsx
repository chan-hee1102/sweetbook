import type { BookPreset } from "@/lib/books";
import { formatDate } from "@/lib/labels";
import type { Pet } from "@/lib/types";

/**
 * 책 표지 — 같은 형태를 세 크기로 반복해서, 홈 목록·미리보기·주문 어디에서 봐도
 * 같은 물건으로 인지되게 한다.
 *
 * 표지에 사진을 깔지 않는다. 실제 책 표지에 사진이 없을 때 인쇄소가 하는 일은
 * 조판이다. 그래서 표지는 타이포그래피이고, 유일한 유채색은 왼쪽 책등이다.
 */

const SIZES = {
  mini: { w: 44, spine: "3px" },
  small: { w: 72, spine: "4px" },
  large: { w: 180, spine: "8px" },
} as const;

export function BookCover({
  preset,
  pet,
  title,
  from,
  to,
  size = "mini",
}: {
  preset: BookPreset;
  pet: Pet;
  title?: string;
  from?: string;
  to?: string;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  const showText = size === "large";

  return (
    <div
      aria-hidden
      className="book-cover shrink-0"
      style={
        {
          width: s.w,
          aspectRatio: "3 / 4",
          "--spine": preset.spine,
          "--spine-w": s.spine,
        } as React.CSSProperties
      }
    >
      {showText ? (
        <div className="relative z-[3] flex h-full flex-col justify-end p-3.5 pl-6">
          <p className="text-label font-bold text-ink-500">{preset.name}</p>
          <div className="my-2 h-px bg-ink-900/15" />
          <p
            className={`text-[18px] font-extrabold leading-snug tracking-tight text-ink-900 ${
              preset.id === "memorial" ? "font-serifko" : ""
            }`}
          >
            {title ?? preset.defaultTitle(pet)}
          </p>
          {from && to && (
            <p className="mt-1.5 text-label tabular-nums text-ink-500">
              {formatDate(from)} — {formatDate(to)}
            </p>
          )}
        </div>
      ) : (
        // 작은 크기에서는 글자를 넣지 않는다. 책등 색과 비율만으로 충분하고,
        // 억지로 넣으면 44px 안에서 뭉개진다.
        <div
          className="relative z-[3] flex h-full items-end justify-end p-1.5 pl-4"
          style={{ fontSize: Math.round(s.w * 0.26) }}
        >
          <span className="font-extrabold leading-none text-ink-900/20">
            {pet.name.trim().charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}

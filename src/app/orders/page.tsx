import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { EmptyState } from "@/components/EmptyState";
import { HistoryTabs } from "@/components/HistoryTabs";
import { StatusBadge } from "@/components/OrderStatusView";
import { BOOK_PRESETS } from "@/lib/books";
import { formatDate, ORDER_STATUS, ORDER_STEPS, shortId } from "@/lib/labels";
import { getPet, listOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const orders = listOrders();

  return (
    <div className="space-y-6">
      <HistoryTabs
        active="/orders"
        description="만들고 있는 책이 지금 어디까지 왔는지 볼 수 있습니다."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="주문한 책이 없습니다"
          description="저장한 기록으로 성장 스토리북, 건강수첩, 추모 앨범을 만들 수 있습니다."
          actionLabel="책으로 남기기"
          actionHref="/books/growth"
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const pet = getPet(order.petId);
            const preset = BOOK_PRESETS[order.bookType];
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="card flex items-center gap-3.5 px-4 py-4 transition hover:bg-ink-50 active:scale-[0.99]"
                >
                  {pet && <BookCover preset={preset} pet={pet} size="mini" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-label font-bold text-ink-500">{preset.name}</p>
                    <p className="mt-0.5 truncate text-body font-bold text-ink-900">
                      {order.title}
                    </p>
                    <p className="mt-0.5 text-caption tabular-nums text-ink-600">
                      {formatDate(order.periodStart)}—{formatDate(order.periodEnd)} ·{" "}
                      {order.recordCount}개 수록
                    </p>
                    <p className="text-caption tabular-nums text-ink-600">
                      주문번호 {shortId(order.id)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* 운영자 화면 진입은 여기 하나로 모은다.
          소비자 화면 모든 곳에 내부 도구 링크를 두면 크롬이 지저분해지고,
          그렇다고 감추면 심사자가 상태 전이·CSV를 못 찾는다. 주문을 보는
          화면이 가장 자연스러운 자리다. */}
      <div className="rounded-control bg-ink-50 px-4 py-3.5">
        {orders.length > 0 && (
          <p className="text-caption leading-relaxed text-ink-600">
            {ORDER_STEPS.map((s) => ORDER_STATUS[s].badge).join(" → ")} 순으로
            진행됩니다. 데모라 결제·배송은 실제로 이뤄지지 않습니다.
          </p>
        )}
        <Link
          href="/admin"
          className={`tap font-semibold text-ink-600 underline underline-offset-2 hover:text-ink-900 ${
            orders.length > 0 ? "mt-1" : ""
          }`}
        >
          운영자 화면 — 제작 상태 넘기기 · CSV 내려받기
        </Link>
      </div>
    </div>
  );
}

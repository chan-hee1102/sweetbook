import { EmptyState } from "@/components/EmptyState";
import { IconDownload } from "@/components/icons";
import { StatusBadge } from "@/components/OrderStatusView";
import {
  advanceOrderAction,
  clearAllAction,
  loadSampleAction,
} from "@/lib/actions";
import { BOOK_PRESETS } from "@/lib/books";
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS,
  ORDER_STEPS,
  shortId,
} from "@/lib/labels";
import { getPet, listOrders, nextStatusOf } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const orders = listOrders();

  const counts = orders.reduce(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {} as Record<OrderStatus, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title font-extrabold tracking-tight text-ink-900">
          운영자 · 주문 관리
        </h1>
        <p className="mt-1 text-body text-ink-600">
          접수된 주문을 확인하고 제작 상태를 넘깁니다.
        </p>
        <p className="mt-2 rounded-control bg-amber-50 px-3 py-2 text-caption leading-relaxed text-amber-900">
          과제에서 회원 인증은 구현 대상이 아니어서, 이 앱은 단일 사용자 데모로
          두었습니다. 등록한 반려동물·주문은 계정 구분 없이 한 벌만 존재하고, 이
          운영자 화면도 누구나 들어올 수 있습니다. 실제 서비스라면 소유자 범위와
          이 화면 모두 인증 뒤에 있어야 합니다.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ORDER_STEPS.map((s) => (
          <div key={s} className="card px-2 py-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums text-ink-900">
              {counts[s] ?? 0}
            </p>
            <p className="mt-0.5 text-label font-bold text-ink-600">
              {ORDER_STATUS[s].badge}
            </p>
          </div>
        ))}
      </div>

      <a href="/api/orders.csv" className="btn-ghost w-full" download>
        <IconDownload size={18} /> 주문 내역 CSV로 내려받기
      </a>

      {orders.length === 0 ? (
        <EmptyState
          title="접수된 주문이 없습니다"
          description="보호자가 책을 주문하면 여기에 표시됩니다. 직접 하나 주문해 보면 흐름을 확인할 수 있습니다."
          actionLabel="책으로 남기기"
          actionHref="/books/growth"
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const pet = getPet(order.petId);
            const preset = BOOK_PRESETS[order.bookType];
            const next = nextStatusOf(order.status);
            const advanceLabel = ORDER_STATUS[order.status].advance;

            return (
              <li key={order.id} className="card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-caption tabular-nums text-ink-600">
                      {shortId(order.id)}
                    </p>
                    <p className="mt-0.5 truncate text-body font-bold text-ink-900">
                      {order.title}
                    </p>
                    <p className="mt-0.5 text-caption tabular-nums text-ink-600">
                      {pet?.name ?? "삭제된 반려동물"} · {preset.name} ·{" "}
                      {order.recordCount}개
                    </p>
                    <p className="mt-0.5 text-caption tabular-nums text-ink-600">
                      기간 {formatDate(order.periodStart)}—{formatDate(order.periodEnd)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-200 pt-3">
                  <p className="text-caption tabular-nums text-ink-600">
                    최근 변경 {formatDateTime(order.updatedAt)}
                  </p>
                  {next && advanceLabel ? (
                    <form action={advanceOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-[44px] items-center rounded-control bg-ink-800 px-3 text-caption font-bold text-white transition hover:bg-ink-900 active:scale-95"
                      >
                        {advanceLabel} →
                      </button>
                    </form>
                  ) : (
                    <span className="text-caption font-semibold text-ink-600">
                      더 넘길 단계 없음
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="rounded-control bg-ink-50 px-4 py-3 text-caption leading-relaxed text-ink-600">
        상태는 <b>pending → processing → shipped → delivered</b> 한 방향으로만
        넘어갑니다. 되돌리기나 단계 건너뛰기는 저장소에서 막아 두었습니다.
        결제·배송은 구현 대상이 아니라, 주문 흐름을 끝까지 보여주기 위한 상태
        관리까지만 구현했습니다.
      </p>

      {/* 데모 도구. 소비자 화면에 두면 실제 사용자가 자기 데이터를 지울 수 있어
          운영자 화면에만 둔다. */}
      <section className="rule pt-5">
        <h2 className="text-section font-bold text-ink-900">데모 도구</h2>
        <p className="mt-1 text-caption leading-relaxed text-ink-600">
          심사용입니다. 예시 데이터를 넣거나, 전부 비우고 등록 흐름을 처음부터
          확인하실 수 있습니다.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <form action={loadSampleAction}>
            <input type="hidden" name="next" value="/?sample=1" />
            <button type="submit" className="btn-ghost w-full">
              예시 데이터 넣기
            </button>
          </form>
          <form action={clearAllAction}>
            <button type="submit" className="btn-ghost w-full">
              전부 비우기
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

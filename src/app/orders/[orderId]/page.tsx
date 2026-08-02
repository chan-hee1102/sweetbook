import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { StatusSteps } from "@/components/OrderStatusView";
import { IconChevronLeft } from "@/components/icons";
import { PhotoTile } from "@/components/PhotoTile";
import { BOOK_PRESETS } from "@/lib/books";
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS,
  RECORD_KIND,
  shortId,
} from "@/lib/labels";
import { getOrder, getPet, listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  searchParams: { created?: string };
}) {
  const order = getOrder(params.orderId);
  if (!order) notFound();

  const pet = getPet(order.petId);
  const preset = BOOK_PRESETS[order.bookType];
  const status = ORDER_STATUS[order.status];

  const included = listRecords(order.petId)
    .filter((r) => order.recordIds.includes(r.id))
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  return (
    <div className="space-y-6">
      <Link href="/orders" className="tap gap-1 text-caption font-semibold text-ink-600 hover:text-ink-800">
        <IconChevronLeft size={14} /> 주문 내역
      </Link>

      {searchParams.created && (
        <div role="status" className="rounded-control bg-brand-50 px-4 py-4">
          <p className="text-body font-bold text-brand-900">주문을 접수했습니다</p>
          <p className="mt-1 text-body text-brand-800">
            {pet?.name} · {preset.name} 제작을 시작합니다. 진행 단계는 이 화면에서
            확인할 수 있습니다.
          </p>
        </div>
      )}

      {/* 미리보기에서 세로 책으로 본 물건이 주문 화면에서도 같은 물건이어야 한다 */}
      <section className="card flex gap-4 px-4 py-4">
        {pet && <BookCover preset={preset} pet={pet} size="small" />}
        <div className="min-w-0 flex-1">
          <p className="text-label font-bold text-ink-500">{preset.name}</p>
          <h1 className="mt-1 text-title font-extrabold leading-snug tracking-tight text-ink-900">
            {order.title}
          </h1>
          <p className="mt-1 text-body tabular-nums text-ink-600">
            {pet?.name} · {formatDate(order.periodStart)}—{formatDate(order.periodEnd)}
          </p>
          <p className="text-body tabular-nums text-ink-600">{order.recordCount}개 수록</p>
        </div>
      </section>

      {/* ── 진행 상태 ──
          'processing' 같은 내부 단계명 대신, 지금 무슨 일이 일어나고 있는지를
          보호자의 말로 보여준다. */}
      <section className="card px-4 py-4">
        <StatusSteps status={order.status} />
        <p className="mt-4 text-section font-bold text-ink-900">{status.badge}</p>
        <p className="mt-1 text-body text-ink-600">{status.message}</p>
        <dl className="mt-4 space-y-1 border-t border-ink-200 pt-3 text-caption text-ink-600">
          <div className="flex justify-between">
            <dt>주문번호</dt>
            <dd className="font-semibold tabular-nums text-ink-800">{shortId(order.id)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>주문한 날</dt>
            <dd className="tabular-nums">{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>최근 변경</dt>
            <dd className="tabular-nums">{formatDateTime(order.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-section font-bold text-ink-900">이 책에 담긴 기록</h2>
        <ol className="card divide-y divide-ink-100">
          {included.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <PhotoTile photo={r.photo} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold text-ink-800">{r.title}</p>
                <p className="text-caption tabular-nums text-ink-600">
                  {formatDate(r.recordedAt)} · {RECORD_KIND[r.kind].label}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 주문 완료가 막다른 골목이 되지 않도록 다음 행동을 둔다 */}
      <section className="space-y-2">
        <Link href={`/pets/${order.petId}`} className="btn-ghost w-full">
          {pet?.name} 기록으로 가기
        </Link>
        <div className="rounded-control bg-ink-50 px-4 py-3">
          <p className="text-caption leading-relaxed text-ink-600">
            채용 과제용 데모입니다. 결제·배송·실제 인쇄는 진행되지 않으며, 주문 접수와
            제작 상태 관리까지만 구현되어 있습니다.
          </p>
          <Link
            href="/admin"
            className="tap mt-1 text-caption font-bold text-ink-700 underline underline-offset-2 hover:text-ink-900"
          >
            운영자 화면에서 제작 상태 넘겨보기 →
          </Link>
        </div>
      </section>
    </div>
  );
}

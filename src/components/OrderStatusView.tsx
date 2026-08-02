import { ORDER_STATUS, ORDER_STEPS } from "@/lib/labels";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-caption font-bold ${s.tone}`}
    >
      {s.badge}
    </span>
  );
}

/**
 * 주문 진행 상태를 단계로 보여준다.
 * 보호자는 'processing'이 아니라 "지금 어디까지 왔는지"를 알고 싶어 한다.
 */
export function StatusSteps({ status }: { status: OrderStatus }) {
  const current = ORDER_STATUS[status].step;

  return (
    <ol className="flex items-center gap-1.5" aria-label="주문 진행 상태">
      {ORDER_STEPS.map((step) => {
        const s = ORDER_STATUS[step];
        const done = s.step <= current;
        const now = s.step === current;
        return (
          <li
            key={step}
            aria-current={now ? "step" : undefined}
            className="flex flex-1 flex-col gap-1.5"
          >
            <span
              aria-hidden
              className={`h-2 rounded-full ${done ? "bg-brand-700" : "bg-ink-400"}`}
            />
            <span
              className={`text-label font-bold ${now ? "text-brand-800" : "text-ink-600"}`}
            >
              {now && <span className="sr-only">현재 단계: </span>}
              {s.badge}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

import Link from "next/link";

/**
 * 빈 화면은 "없음"만 알리면 실패다. 왜 비었는지와 다음에 뭘 누르면 되는지를
 * 같이 준다.
 *
 * 그림은 넣지 않는다. 큰 이모지를 넣는 건 공백이 무서워서 하는 일이고,
 * 문장 하나와 버튼 하나면 할 일을 다 한다.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="text-section font-bold text-ink-900">{title}</p>
      <p className="mt-2 text-body text-ink-600">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

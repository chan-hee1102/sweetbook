/**
 * 화면 전환 중 빈 흰 화면 대신 뼈대를 보여준다.
 *
 * loading.tsx는 이 경로에만 둔다. 루트에 두면 모든 페이지가 Suspense로 감싸져
 * 스트리밍이 먼저 시작되는데, 그러면 응답 헤더가 이미 나간 뒤라 notFound()가
 * 404를 못 내보내고 200으로 응답한다. 없는 반려동물·주문 주소는 제대로 404가
 * 나와야 하므로, 검색이 도는 이 화면에만 스켈레톤을 둔다.
 */
export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="불러오는 중">
      <div className="h-6 w-1/2 animate-pulse rounded-control bg-ink-100" />
      <div className="h-24 animate-pulse rounded-card bg-ink-100" />
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-ink-100" />
        ))}
      </div>
      <span className="sr-only">불러오는 중입니다</span>
    </div>
  );
}

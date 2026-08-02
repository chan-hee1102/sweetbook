import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="mt-3 text-section font-bold text-ink-800">
        이 주소에는 화면이 없습니다
      </p>
      <p className="mt-1.5 text-body text-ink-600">
        주소가 바뀌었거나 지워진 기록일 수 있습니다.
      </p>
      <Link href="/" className="btn-primary mt-5">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

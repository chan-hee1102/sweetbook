"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="mt-3 text-section font-bold text-ink-800">
        화면을 불러오지 못했습니다
      </p>
      <p className="mt-1.5 text-body text-ink-600">
        다시 시도 버튼을 눌러 주세요. 같은 화면이 계속 나오면 홈에서 처음부터
        진행해 주세요. 증상이 급한 상황이면 도담을 기다리지 말고 바로 동물병원에
        연락하세요.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-caption text-ink-600">오류 코드 {error.digest}</p>
      )}
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">
          다시 시도
        </button>
        <a href="/" className="btn-ghost">
          홈으로
        </a>
      </div>
    </div>
  );
}

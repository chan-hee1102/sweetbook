import Link from "next/link";
import { PetForm } from "@/components/PetForm";
import { loadSampleAction } from "@/lib/actions";

/**
 * 등록된 반려동물이 없을 때 기능 진입을 막고 뜨는 등록 창.
 *
 * 이 서비스의 모든 판정은 종·나이·품종에 따라 달라진다. 누구를 확인하는지
 * 모르는 채로는 증상 확인도 책 만들기도 시작할 수 없어서, 안내 문구로
 * 넘기지 않고 그 자리에서 바로 등록하게 한다.
 */
export function PetGate({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  /** 등록이 끝나면 돌아갈 곳 */
  next: string;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-ink-900/40 backdrop-blur-[2px]">
      <div className="flex min-h-full items-center justify-center p-4 pb-28">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pet-gate-title"
          className="w-full max-w-[480px] rounded-panel bg-white p-5 shadow-cover"
        >
          <h2 id="pet-gate-title" className="text-section font-bold text-ink-900">
            {title}
          </h2>
          <p className="mt-1.5 text-body text-ink-600">{description}</p>

          <div className="mt-5">
            {/* 입력이 잘못돼도 /pets/new로 튕겨 나가지 않고 이 창으로 돌아온다 */}
            <PetForm next={next} back={next} compact />
          </div>

          <div className="rule mt-5 pt-4">
            <p className="text-caption text-ink-500">
              먼저 둘러보고 싶으시면 예시 데이터를 넣어 확인하실 수 있습니다.
            </p>
            <div className="mt-2.5 flex gap-2">
              <form action={loadSampleAction} className="flex-1">
                <input type="hidden" name="next" value={next} />
                <button type="submit" className="btn-ghost w-full">
                  예시 데이터로 둘러보기
                </button>
              </form>
              <Link href="/" className="btn-ghost px-4">
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

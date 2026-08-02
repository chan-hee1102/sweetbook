import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";
import { PetForm } from "@/components/PetForm";

export const dynamic = "force-dynamic";

export default function NewPetPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next?.startsWith("/") ? searchParams.next : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="tap gap-1 text-caption font-semibold text-ink-600 hover:text-ink-800"
      >
        <IconChevronLeft size={14} /> 홈
      </Link>

      <div>
        <h1 className="text-title font-extrabold text-ink-900">반려동물 등록</h1>
        <p className="mt-1.5 text-body text-ink-600">
          종과 나이에 따라 확인하는 증상과 참고 자료가 달라집니다.
        </p>
      </div>

      {searchParams.error === "name" && (
        <p role="alert" className="rounded-control bg-rose-50 px-4 py-3 text-body font-semibold text-triage-emergency">
          이름이 비어 있습니다. 부르는 이름을 적어 주세요.
        </p>
      )}
      {searchParams.error === "species" && (
        <p role="alert" className="rounded-control bg-rose-50 px-4 py-3 text-body font-semibold text-triage-emergency">
          강아지인지 고양이인지 골라 주세요.
        </p>
      )}

      <div className="card px-4 py-5">
        <PetForm next={next} />
      </div>
    </div>
  );
}

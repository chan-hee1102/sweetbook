import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { HistoryTabs } from "@/components/HistoryTabs";
import { IconChevronRight, IconStethoscope } from "@/components/icons";
import { PhotoTile } from "@/components/PhotoTile";
import { formatDate } from "@/lib/labels";
import { listPets, listRecords } from "@/lib/store";
import { levelLabel } from "@/lib/triage";
import type { TriageLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * 증상 확인 내역.
 *
 * 주문 내역은 있는데 정작 이 서비스의 본업인 증상 확인은 지난 기록을 모아 보는
 * 자리가 없었다. 반려동물별 기록에 섞여 있어서, "지난번엔 뭐라고 나왔더라"를
 * 확인하려면 아이를 고르고 필터를 걸어야 했다.
 *
 * 진료 때 "언제부터 그랬어요?"에 답하려면 이 목록이 필요하다.
 */

const LEVEL_BADGE: Record<TriageLevel, string> = {
  emergency: "bg-triage-emergency text-white",
  soon: "bg-amber-50 text-triage-soon border border-triage-soon/40",
  watch: "bg-ink-100 text-ink-700",
};

export default function HistoryPage() {
  const pets = listPets();

  // 모든 반려동물의 증상 확인 기록을 최신순으로 모은다
  const rows = pets
    .flatMap((pet) =>
      listRecords(pet.id, { kinds: ["diagnose"] }).map((r) => ({ pet, r }))
    )
    .sort((a, b) => b.r.recordedAt.localeCompare(a.r.recordedAt));

  const counts = rows.reduce(
    (acc, { r }) => {
      if (r.triage) acc[r.triage] = (acc[r.triage] ?? 0) + 1;
      return acc;
    },
    {} as Record<TriageLevel, number>
  );

  return (
    <div className="space-y-6">
      <HistoryTabs
        active="/history"
        description="지금까지 확인하고 저장한 결과입니다."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="저장한 확인 결과가 없습니다"
          description="증상을 확인한 뒤 결과 화면에서 저장하면 여기에 쌓입니다. 진료 때 언제부터 그랬는지 바로 보여줄 수 있습니다."
          actionLabel="증상 확인하기"
          actionHref="/diagnose"
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(["emergency", "soon", "watch"] as TriageLevel[]).map((lv) => (
              <div key={lv} className="card border border-ink-200 px-2 py-3 text-center">
                <p className="text-2xl font-extrabold tabular-nums text-ink-900">
                  {counts[lv] ?? 0}
                </p>
                <p className="mt-0.5 text-label font-bold text-ink-600">
                  {levelLabel(lv)}
                </p>
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {rows.map(({ pet, r }) => (
              <li key={r.id}>
                <Link
                  href={`/pets/${pet.id}?kind=diagnose`}
                  className="card flex items-center gap-3.5 border border-ink-200 px-4 py-3.5 transition hover:bg-ink-50"
                >
                  <PhotoTile photo={pet.photo} name={pet.name} size={40} radius={999} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-body font-bold text-ink-900">{pet.name}</span>
                      {r.triage && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-label font-bold ${LEVEL_BADGE[r.triage]}`}
                        >
                          {levelLabel(r.triage)}
                        </span>
                      )}
                      <span className="text-label tabular-nums text-ink-600">
                        {formatDate(r.recordedAt)}
                      </span>
                    </div>
                    {r.note && (
                      <p className="mt-1 truncate text-caption text-ink-600">{r.note}</p>
                    )}
                  </div>
                  <IconChevronRight size={18} className="text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/diagnose" className="btn-primary w-full">
            <IconStethoscope size={18} /> 새로 확인하기
          </Link>
        </>
      )}
    </div>
  );
}

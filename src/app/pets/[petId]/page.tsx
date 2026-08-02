import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { EmptyState } from "@/components/EmptyState";
import { IconChevronRight, IconStethoscope } from "@/components/icons";
import { PhotoInput } from "@/components/PhotoInput";
import { PhotoTile } from "@/components/PhotoTile";
import {
  createRecordAction,
  deleteRecordAction,
  updateRecordAction,
} from "@/lib/actions";
import { BOOK_ORDER, BOOK_PRESETS, isRecommended } from "@/lib/books";
import { withJosa } from "@/lib/josa";
import { ageText, formatDate, RECORD_KIND, SPECIES_LABEL } from "@/lib/labels";
import { getPet, listRecords } from "@/lib/store";
import { levelLabel } from "@/lib/triage";
import type { RecordKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KIND_ORDER: RecordKind[] = [
  "daily",
  "growth",
  "diagnose",
  "hospital",
  "vaccine",
  "training",
];

export default function PetPage({
  params,
  searchParams,
}: {
  params: { petId: string };
  searchParams: {
    saved?: string;
    error?: string;
    kind?: string;
    edit?: string;
    delete?: string;
    deleted?: string;
    /** 고치기를 끝내면 돌아갈 자리. 책 만들기 3단계에서 넘어올 때 쓴다. */
    next?: string;
  };
}) {
  const pet = getPet(params.petId);
  if (!pet) notFound();

  const editingId = searchParams.edit ?? null;
  // 앱 내부 경로만 복귀 대상으로 받는다 (열린 리다이렉트 방지)
  const backTo =
    searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : null;
  const deletingId = searchParams.delete ?? null;

  const all = listRecords(pet.id);
  const filter = KIND_ORDER.includes(searchParams.kind as RecordKind)
    ? (searchParams.kind as RecordKind)
    : null;
  const records = filter ? all.filter((r) => r.kind === filter) : all;

  const weights = all
    .filter((r) => r.weightKg !== null)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const latestWeight = weights[weights.length - 1];
  const firstWeight = weights[0];

  const healthPreset = BOOK_PRESETS.health;
  const healthCount = all.filter((r) => healthPreset.kinds.includes(r.kind)).length;
  const titleError = searchParams.error === "title";

  return (
    <div className="space-y-8">
      {/* 진단 결과를 저장한 직후에는 다음 행동을 보여준다.
          이 서비스의 서사가 진단 → 기록 → 책이므로, 저장하고 끝나면 흐름이 끊긴다. */}
      {searchParams.saved === "diagnose" && (
        <div role="status" className="rounded-card border border-brand-300 bg-brand-50 px-4 py-4">
          <p className="text-body font-bold text-brand-900">
            증상 확인 결과를 {pet.name} 기록에 저장했습니다
          </p>
          <p className="mt-1 text-body text-brand-800">
            건강수첩에 담을 기록이 {healthCount}개가 됐습니다.
          </p>
          <Link href={`/books/health?pet=${pet.id}`} className="btn-primary mt-3 w-full">
            건강수첩 미리보기 →
          </Link>
        </div>
      )}
      {searchParams.saved === "1" && (
        <p role="status" className="rounded-control bg-brand-50 px-4 py-3 text-body font-semibold text-brand-800">
          기록을 저장했습니다.
        </p>
      )}
      {searchParams.saved === "edit" && (
        <p role="status" className="rounded-control bg-brand-50 px-4 py-3 text-body font-semibold text-brand-800">
          기록을 수정했습니다.
        </p>
      )}
      {searchParams.deleted && (
        <p role="status" className="rounded-control bg-ink-100 px-4 py-3 text-body font-semibold text-ink-700">
          기록을 지웠습니다.
        </p>
      )}
      {titleError && (
        <p id="title-error" role="alert" className="rounded-control bg-rose-50 px-4 py-3 text-body font-semibold text-rose-800">
          제목이 비어 있습니다. 무슨 일이 있었는지 한 줄로 적어 주세요.{" "}
          <a href="#title" className="underline underline-offset-2">
            입력란으로 이동
          </a>
        </p>
      )}

      {/* ── 프로필 ── */}
      <section className="flex items-center gap-4">
        <PhotoTile photo={pet.photo} name={pet.name} size={64} radius={14} alt={`${pet.name} 사진`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-title font-extrabold tracking-tight text-ink-900">
              {pet.name}
            </h1>
            {pet.passedAt && (
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-caption font-semibold tabular-nums text-ink-600">
                {formatDate(pet.passedAt)}
              </span>
            )}
          </div>
          <p className="mt-1 text-body text-ink-600">
            {SPECIES_LABEL[pet.species]} · {pet.breed ?? "품종 미등록"}
            {ageText(pet.birth, pet.passedAt) && ` · ${ageText(pet.birth, pet.passedAt)}`}
          </p>
          {latestWeight && (
            <p className="mt-0.5 text-body text-ink-600">
              최근 체중{" "}
              <span className="font-semibold tabular-nums text-ink-800">
                {latestWeight.weightKg}kg
              </span>
              {firstWeight && firstWeight.id !== latestWeight.id && (
                <span className="tabular-nums">
                  {" "}
                  (첫 기록 {firstWeight.weightKg}kg 대비{" "}
                  {(latestWeight.weightKg! - firstWeight.weightKg!).toFixed(1)}kg)
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Link href={`/diagnose?pet=${pet.id}`} className="btn-primary col-span-2">
          <IconStethoscope size={18} /> 증상 확인
        </Link>
        <a href="#new-record" className="btn-ghost">
          기록 추가
        </a>
      </div>

      {/* ── 이 아이에게 권하는 책 ── */}
      <section>
        <h2 className="mb-3 text-section font-bold text-ink-900">
          {withJosa(pet.name, "과와")} 함께한 기록을 책으로
        </h2>
        <div className="space-y-2">
          {BOOK_ORDER.map((type) => {
            const preset = BOOK_PRESETS[type];
            const count = all.filter((r) => preset.kinds.includes(r.kind)).length;
            return (
              <Link
                key={type}
                href={`/books/${type}?pet=${pet.id}`}
                className="card flex items-center gap-3.5 px-4 py-3 transition hover:bg-ink-50"
              >
                <BookCover preset={preset} pet={pet} size="mini" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-body font-bold text-ink-800">{preset.name}</span>
                    {isRecommended(pet, type) && (
                      <span
                        className={`rounded border px-1.5 py-0.5 text-caption font-bold ${preset.accentSoft}`}
                      >
                        추천
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-caption tabular-nums text-ink-600">
                    담을 수 있는 기록 {count}개
                  </span>
                </span>
                <IconChevronRight size={18} className="text-ink-400" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 기록 타임라인 ── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-section font-bold text-ink-900">기록</h2>
          <span className="text-caption font-semibold tabular-nums text-ink-600">
            전체 {all.length}개
          </span>
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <FilterChip href={`/pets/${pet.id}`} active={!filter}>
            전체
          </FilterChip>
          {KIND_ORDER.map((kind) => {
            const n = all.filter((r) => r.kind === kind).length;
            if (n === 0) return null;
            return (
              <FilterChip
                key={kind}
                href={`/pets/${pet.id}?kind=${kind}`}
                active={filter === kind}
              >
                {(() => {
                  const K = RECORD_KIND[kind].Icon;
                  return <K size={15} />;
                })()}
                {RECORD_KIND[kind].label} {n}
              </FilterChip>
            );
          })}
        </div>

        {records.length === 0 ? (
          <EmptyState
            title={filter ? "이 종류의 기록이 없습니다" : "저장한 기록이 없습니다"}
            description={
              filter
                ? "다른 종류를 고르거나 아래에서 새 기록을 저장하세요."
                : "아래 새 기록에서 첫 기록을 저장하세요. 기록이 쌓이면 책으로 만들 수 있습니다."
            }
          />
        ) : (
          <ol className="space-y-2">
            {records.map((r) => {
              const meta = RECORD_KIND[r.kind];

              /* 편집·삭제를 자바스크립트 없이 처리한다.
                 ?edit=<id>  → 그 줄이 폼으로 바뀐다
                 ?delete=<id> → 그 줄이 확인 문구로 바뀐다
                 삭제는 되돌릴 수 없으므로 한 번 더 묻는다. */
              if (deletingId === r.id) {
                return (
                  <li key={r.id} className="card border border-triage-emergency/30 px-4 py-4">
                    <p className="text-body font-bold text-ink-900">
                      이 기록을 지울까요?
                    </p>
                    <p className="mt-1 text-caption text-ink-600">
                      {formatDate(r.recordedAt)} · {r.title} — 지우면 되돌릴 수 없습니다.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <form action={deleteRecordAction} className="flex-1">
                        <input type="hidden" name="recordId" value={r.id} />
                        <input type="hidden" name="petId" value={pet.id} />
                        <button
                          type="submit"
                          className="btn w-full bg-triage-emergency text-white hover:brightness-110"
                        >
                          지우기
                        </button>
                      </form>
                      <Link href={`/pets/${pet.id}`} className="btn-ghost flex-1">
                        그대로 두기
                      </Link>
                    </div>
                  </li>
                );
              }

              if (editingId === r.id) {
                return (
                  <li key={r.id} className="card border border-brand-300 px-4 py-4">
                    {backTo && (
                      <p className="mb-3 rounded-control bg-brand-50 px-3 py-2 text-caption font-semibold text-brand-800">
                        책에 담을 내용을 고치는 중입니다. 저장하면 만들던 자리로
                        돌아갑니다.
                      </p>
                    )}
                    <form action={updateRecordAction} className="space-y-3">
                      <input type="hidden" name="recordId" value={r.id} />
                      <input type="hidden" name="petId" value={pet.id} />
                      {backTo && <input type="hidden" name="next" value={backTo} />}

                      <PhotoInput
                        initial={r.photo}
                        hint="선택 사항입니다. 책에 이 사진이 함께 실립니다."
                      />

                      <div>
                        <label htmlFor={`t-${r.id}`} className="label">
                          무슨 일이 있었는지 <span className="text-triage-emergency">*</span>
                        </label>
                        <input
                          id={`t-${r.id}`}
                          name="title"
                          required
                          defaultValue={r.title}
                          className="field"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label htmlFor={`k-${r.id}`} className="label">
                            종류
                          </label>
                          <select
                            id={`k-${r.id}`}
                            name="kind"
                            className="field"
                            defaultValue={r.kind}
                          >
                            {KIND_ORDER.map((k) => (
                              <option key={k} value={k}>
                                {RECORD_KIND[k].label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`d-${r.id}`} className="label">
                            날짜
                          </label>
                          <input
                            id={`d-${r.id}`}
                            name="recordedAt"
                            type="date"
                            defaultValue={r.recordedAt}
                            className="field tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`w-${r.id}`} className="label">
                          체중 (kg) <span className="font-normal text-ink-500">(선택)</span>
                        </label>
                        <input
                          id={`w-${r.id}`}
                          name="weightKg"
                          type="number"
                          step="0.1"
                          min="0"
                          defaultValue={r.weightKg ?? ""}
                          className="field tabular-nums"
                        />
                      </div>

                      <div>
                        <label htmlFor={`n-${r.id}`} className="label">
                          메모 <span className="font-normal text-ink-500">(선택)</span>
                        </label>
                        <textarea
                          id={`n-${r.id}`}
                          name="note"
                          rows={2}
                          defaultValue={r.note}
                          className="field resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex-1">
                          저장하기
                        </button>
                        <Link
                          href={backTo ?? `/pets/${pet.id}`}
                          className="btn-ghost flex-1"
                        >
                          취소
                        </Link>
                      </div>
                    </form>

                    <Link
                      href={`/pets/${pet.id}?delete=${r.id}`}
                      className="tap mt-2 w-full justify-center text-caption font-semibold text-triage-emergency underline underline-offset-2"
                    >
                      이 기록 지우기
                    </Link>
                  </li>
                );
              }

              return (
                <li key={r.id} className="card flex gap-3 px-4 py-3">
                  <PhotoTile photo={r.photo} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-caption font-bold ${meta.chip}`}>
                        {meta.label}
                      </span>
                      <span className="text-caption tabular-nums text-ink-600">
                        {formatDate(r.recordedAt)}
                      </span>
                      {r.weightKg !== null && (
                        <span className="text-caption font-semibold tabular-nums text-ink-700">
                          {r.weightKg}kg
                        </span>
                      )}
                      {r.triage && (
                        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-caption font-bold text-ink-700">
                          {levelLabel(r.triage)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-body font-bold text-ink-900">{r.title}</p>
                    {r.note && (
                      <p className="mt-0.5 text-body text-ink-600">
                        {r.note}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/pets/${pet.id}?edit=${r.id}`}
                    aria-label={`${r.title} 기록 수정`}
                    className="tap shrink-0 self-start px-1 text-caption font-semibold text-ink-500 hover:text-ink-800"
                  >
                    수정
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── 기록 추가 ── */}
      <section id="new-record" className="card px-4 py-4">
        <h2 className="text-section font-bold text-ink-900">새 기록</h2>
        <form action={createRecordAction} className="mt-3 space-y-3">
          <input type="hidden" name="petId" value={pet.id} />
          {backTo && <input type="hidden" name="next" value={backTo} />}

          <PhotoInput hint="선택 사항입니다. 책에 이 사진이 함께 실립니다." />

          <div>
            <label htmlFor="title" className="label">
              무슨 일이 있었는지 <span className="font-normal text-rose-700">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              autoFocus={titleError}
              aria-invalid={titleError || undefined}
              aria-describedby={titleError ? "title-error" : undefined}
              placeholder="예) 첫 눈 구경"
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="kind" className="label">
                종류
              </label>
              <select id="kind" name="kind" className="field" defaultValue="daily">
                {KIND_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {RECORD_KIND[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recordedAt" className="label">
                날짜
              </label>
              <input
                id="recordedAt"
                name="recordedAt"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="field tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="weightKg" className="label">
                체중 <span className="font-normal text-ink-500">(선택)</span>
              </label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                step="0.1"
                min="0"
                placeholder="kg"
                className="field tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="photo" className="label">
                사진 자리에 넣을 장면
              </label>
              <select id="photo" name="photo" className="field" defaultValue="home">
                <option value="home">집</option>
                <option value="park">산책</option>
                <option value="meadow">들판</option>
                <option value="ocean">바다</option>
                <option value="snow">눈</option>
                <option value="spring">봄</option>
                <option value="sunset">노을</option>
                <option value="clinic">병원</option>
                <option value="cake">기념일</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="note" className="label">
              메모 <span className="font-normal text-ink-500">(선택)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="그날의 기억을 한 줄로"
              className="field resize-none"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            저장하기
          </button>
        </form>
      </section>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-[44px] shrink-0 items-center rounded-control border px-3 text-caption font-bold transition ${
        active
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-ink-300 bg-white text-ink-700 hover:bg-ink-50"
      }`}
    >
      {children}
    </Link>
  );
}

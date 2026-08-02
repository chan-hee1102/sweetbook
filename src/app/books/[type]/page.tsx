import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { IconChevronLeft } from "@/components/icons";
import { PetForm } from "@/components/PetForm";
import { PetGate } from "@/components/PetGate";
import { PhotoTile } from "@/components/PhotoTile";
import { createOrderAction } from "@/lib/actions";
import {
  BOOK_PRESETS,
  defaultPeriod,
  GOODS_OPTIONS,
  isBookType,
  isGoods,
  isRecommended,
  selectRecords,
  type BookPreset,
} from "@/lib/books";
import { ageText, formatDate, RECORD_KIND, SPECIES_LABEL } from "@/lib/labels";
import { listPets, listRecords } from "@/lib/store";
import { levelLabel } from "@/lib/triage";
import type { Pet, PetRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * 책 만들기도 증상 확인과 같은 단계 팝업이다.
 *
 *   1 누구의 책  →  2 무엇을 담을까
 *
 * 기간을 고르는 단계가 따로 있었는데 걷어냈다. 기본값이 '전부'인 데다 다음
 * 화면에서 한 건씩 뺄 수 있어서, 대부분의 사람에게 그 단계는 지나가는 문에
 * 불과했다. 기간은 목록 위의 칩으로 내려 필요한 사람만 쓰게 했다 —
 * 기록이 수백 건인 사람에게는 여전히 체크 해제보다 빠른 길이다.
 */

type SP = {
  pet?: string;
  from?: string;
  to?: string;
  step?: string;
  error?: string;
  sort?: string;
  /** "custom"이면 날짜 직접 입력을 펼친다 */
  range?: string;
  /** 굿즈 옵션 (재질·조각 수) */
  opt?: string;
};
/* "newpet"은 세는 단계가 아니라 1단계의 곁가지다.
   등록하러 다른 화면으로 내보내면 만들던 흐름이 끊긴다. 팝업 안에서 끝내고
   등록된 아이가 곧바로 골라진 채 다음으로 이어지게 한다. */
type Step = "pet" | "newpet" | "make";
const STEPS: Step[] = ["pet", "make"];
const STEP_TITLE: Record<Step, string> = {
  pet: "누구의 책인가요?",
  newpet: "새로 등록하기",
  // 우리 쪽 사정(기록 필터)이 아니라 보호자가 정하려는 것을 묻는다.
  make: "무엇을 담을까요?",
};

export default function BookPage({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams: SP;
}) {
  if (!isBookType(params.type)) notFound();
  const preset = BOOK_PRESETS[params.type];
  const pets = listPets();

  if (pets.length === 0) {
    return (
      <PetGate
        title="누구의 책인가요?"
        description={`${preset.name}은 저장한 기록을 모아 만듭니다. 먼저 반려동물을 등록해 주세요.`}
        next={`/books/${preset.id}`}
      />
    );
  }

  const pet = pets.find((p) => p.id === searchParams.pet) ?? null;
  // 예전 주소(step=period·confirm)로 들어와도 깨지지 않게 둘 다 만들기로 보낸다.
  const step: Step =
    searchParams.step === "newpet" ? "newpet" : !pet ? "pet" : "make";

  // 등록은 아직 1단계 안이다 — 막대를 앞으로 밀지 않는다.
  const index = step === "newpet" ? 1 : STEPS.indexOf(step) + 1;
  const base = `/books/${preset.id}`;
  const back =
    step === "make"
      ? `${base}?pet=${pet?.id ?? ""}&step=pet`
      : step === "newpet"
        ? `${base}?step=pet`
        : null;

  return (
    <div className="sheet">
      <div className="sheet-panel">
        <div className="sheet-body">
          <header className="flex shrink-0 items-center gap-2 border-b border-ink-200 px-4 py-3">
            {back ? (
              <Link
                href={back}
                aria-label="이전 단계"
                className="tap -ml-1 rounded-control px-1 text-ink-600 hover:bg-ink-100"
              >
                <IconChevronLeft size={20} />
              </Link>
            ) : (
              <span className="w-6" aria-hidden />
            )}
            <div className="min-w-0 flex-1 text-center">
              <p className="text-label font-bold text-ink-500">
                {preset.name} · {index} / {STEPS.length}
              </p>
              <h1 className="mt-0.5 truncate text-section font-bold text-ink-900">
                {STEP_TITLE[step]}
              </h1>
            </div>
            <Link
              href="/"
              aria-label="닫기"
              className="tap rounded-control px-2 text-caption font-bold text-ink-500 hover:bg-ink-100"
            >
              닫기
            </Link>
          </header>

          <ol aria-hidden className="flex shrink-0 gap-1 px-4 pt-3">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  i < index ? "bg-brand-700" : "bg-ink-200"
                }`}
              />
            ))}
          </ol>

          {searchParams.error && (
            <p
              role="alert"
              className="mx-4 mt-3 rounded-control bg-rose-50 px-4 py-3 text-caption font-semibold text-rose-800"
            >
              {searchParams.error === "empty"
                ? "그 기간에는 담을 기록이 없습니다. 기간을 넓혀 주세요."
                : searchParams.error === "name"
                  ? "이름이 비어 있습니다. 부르는 이름을 적어 주세요."
                  : searchParams.error === "species"
                    ? "강아지인지 고양이인지 골라 주세요."
                    : "시작일이 종료일보다 늦습니다. 날짜를 다시 확인해 주세요."}
            </p>
          )}

          {step === "pet" && <StepPet pets={pets} preset={preset} sp={searchParams} />}
          {step === "newpet" && <StepNewPet preset={preset} />}
          {step === "make" && pet && (
            <StepMake pet={pet} preset={preset} sp={searchParams} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 1단계 — 누구의 책 ═══════════════ */

function StepPet({
  pets,
  preset,
  sp,
}: {
  pets: Pet[];
  preset: BookPreset;
  sp: SP;
}) {
  /* 목록 첫 칸을 그냥 고르면 추모 앨범이 살아 있는 아이로 시작한다.
     반려동물 목록은 살아 있는 아이가 앞이므로, 이 책에 맞는 아이를 먼저 고른다. */
  const defaultPetId =
    (sp.pet && pets.some((p) => p.id === sp.pet) ? sp.pet : null) ??
    pets.find((p) => isRecommended(p, preset.id))?.id ??
    pets[0]?.id;

  return (
    <form method="get" action={`/books/${preset.id}`} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="step" value="make" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-caption leading-relaxed text-ink-600">{preset.blurb}</p>

        <div className="grid grid-cols-2 gap-2.5">
          {pets.map((p) => {
            const count = listRecords(p.id).filter((r) =>
              preset.kinds.includes(r.kind)
            ).length;
            const recommended = isRecommended(p, preset.id);
            return (
              <label key={p.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="pet"
                  value={p.id}
                  required
                  defaultChecked={p.id === defaultPetId}
                  className="peer sr-only"
                />
                <span className="flex h-full flex-col items-center gap-2 rounded-card border border-ink-300 bg-white px-3 py-4 text-center transition peer-checked:border-2 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                  <PhotoTile photo={p.photo} name={p.name} size={56} radius={999} />
                  <span className="flex items-center gap-1.5">
                    <span className="text-body font-bold text-ink-900">{p.name}</span>
                    {recommended && (
                      <span className="text-label font-bold text-brand-800">추천</span>
                    )}
                  </span>
                  <span className="text-caption leading-tight text-ink-600">
                    {SPECIES_LABEL[p.species]}
                    {ageText(p.birth, p.passedAt) && (
                      <>
                        <br />
                        {ageText(p.birth, p.passedAt)}
                      </>
                    )}
                  </span>
                  <span className="text-label font-bold tabular-nums text-ink-500">
                    담을 기록 {count}개
                  </span>
                </span>
              </label>
            );
          })}

          <Link
            href={`/books/${preset.id}?step=newpet`}
            className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-ink-400 px-3 py-4 text-center transition hover:bg-ink-50"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-2xl font-bold text-ink-500">
              +
            </span>
            <span className="text-body font-bold text-ink-700">새로 등록하기</span>
          </Link>
        </div>
      </div>

      <StepFooter next="다음" />
    </form>
  );
}

/* ═══════════════ 곁가지 — 팝업 안에서 등록 ═══════════════ */

function StepNewPet({ preset }: { preset: BookPreset }) {
  /* 등록이 끝나면 createPetAction이 next에 새 아이의 id를 붙여 돌려보낸다.
     그래서 저장하는 순간 그 아이가 골라진 채로 2단계가 열린다. */
  const next = `/books/${preset.id}?step=make`;
  const back = `/books/${preset.id}?step=newpet`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="mb-4 text-caption leading-relaxed text-ink-600">
        이름과 종만 있으면 등록됩니다. 등록하면 바로 이 아이의 {preset.name}을
        이어서 만듭니다.
      </p>
      <PetForm next={next} back={back} compact />
    </div>
  );
}

/* ═══════════════ 2단계 — 무엇을 담을까 ═══════════════ */

function StepMake({ pet, preset, sp }: { pet: Pet; preset: BookPreset; sp: SP }) {
  const all = listRecords(pet.id);
  const full = defaultPeriod(all, preset);

  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  /* 기간 프리셋. 대부분은 '전부'를 원하므로 그것을 기본으로 두고, 각각 몇 개가
     담기는지를 칩에 함께 적어 눌러보지 않아도 알 수 있게 한다. */
  const ranges = [
    { id: "full", label: "전부", from: full.from, to: full.to },
    {
      id: "year",
      label: "최근 1년",
      from: yearAgo.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    },
  ].map((r) => ({ ...r, count: selectRecords(all, preset, r.from, r.to).length }));

  const from = sp.from || full.from;
  const to = sp.to || full.to;
  const picked = selectRecords(all, preset, from, to);
  const desc = sp.sort === "desc";
  const shown = desc ? [...picked].reverse() : picked;
  const custom = sp.range === "custom";
  const goods = isGoods(preset.id);
  const option = GOODS_OPTIONS[preset.id];

  const url = (over: Record<string, string | undefined>) => {
    const q = new URLSearchParams({ pet: pet.id, step: "make", from, to });
    if (desc) q.set("sort", "desc");
    if (custom) q.set("range", "custom");
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined) q.delete(k);
      else q.set(k, v);
    }
    return `/books/${preset.id}?${q}`;
  };
  const here = url({});

  return (
    <>
      {/* 기간 직접 고르기용 GET 폼. 주문 폼 안에 폼을 중첩할 수 없으므로
          폼은 바깥에 두고 입력만 form 속성으로 연결한다. */}
      <form id="range-form" method="get" action={`/books/${preset.id}`}>
        <input type="hidden" name="pet" value={pet.id} />
        <input type="hidden" name="step" value="make" />
        <input type="hidden" name="range" value="custom" />
        {desc && <input type="hidden" name="sort" value="desc" />}
      </form>

      <form action={createOrderAction} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="petId" value={pet.id} />
        <input type="hidden" name="bookType" value={preset.id} />
        <input type="hidden" name="from" value={from} />
        <input type="hidden" name="to" value={to} />
        <input type="hidden" name="sort" value={desc ? "desc" : "asc"} />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex justify-center py-1">
            {goods && shown[0] ? (
              /* 굿즈는 표지가 아니라 '그 사진 자체'가 결과물이다 */
              <div className="w-full max-w-[240px]">
                <PhotoTile
                  photo={shown[0].photo}
                  size={240}
                  radius={preset.id === "frame" ? 4 : 12}
                  className="h-auto w-full"
                  alt={`${preset.name} 미리보기`}
                />
                <p className="mt-2 text-center text-caption text-ink-600">
                  {preset.maxPicks === 1
                    ? "고른 사진이 이렇게 들어갑니다"
                    : `첫 장 미리보기 · 고른 ${picked.length}장이 순서대로 들어갑니다`}
                </p>
              </div>
            ) : (
              <BookCover preset={preset} pet={pet} from={from} to={to} size="large" />
            )}
          </div>

          {option && (
            <fieldset className="rule pt-4">
              <legend className="label">{option.label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {option.values.map((v, i) => (
                  <label key={v} className="cursor-pointer">
                    <input
                      type="radio"
                      name="option"
                      value={v}
                      defaultChecked={sp.opt ? sp.opt === v : i === 0}
                      className="peer sr-only"
                    />
                    <span className="tap rounded-full border border-ink-300 bg-white px-3.5 py-1.5 text-caption font-bold text-ink-600 transition peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="title" className="label">
              {goods ? "이름" : "책 제목"}
            </label>
            <input
              id="title"
              name="title"
              defaultValue={preset.defaultTitle(pet)}
              className="field"
            />
          </div>

          {/* ── 기간 ── */}
          <div className="rule pt-4">
            <p className="label">기간</p>
            <div className="flex flex-wrap gap-1.5">
              {ranges.map((r) => {
                const on = !custom && r.from === from && r.to === to;
                return (
                  <Link
                    key={r.id}
                    href={url({ from: r.from, to: r.to, range: undefined })}
                    aria-current={on ? "true" : undefined}
                    className={`tap rounded-full border px-3 py-1.5 text-caption font-bold tabular-nums transition ${
                      on
                        ? "border-brand-700 bg-brand-50 text-brand-800"
                        : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {r.label} {r.count}
                  </Link>
                );
              })}
              <Link
                href={custom ? url({ range: undefined }) : url({ range: "custom" })}
                aria-current={custom ? "true" : undefined}
                className={`tap rounded-full border px-3 py-1.5 text-caption font-bold transition ${
                  custom
                    ? "border-brand-700 bg-brand-50 text-brand-800"
                    : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"
                }`}
              >
                직접 고르기
              </Link>
            </div>

            {custom ? (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="from-pick" className="label">
                    시작일
                  </label>
                  <input
                    id="from-pick"
                    form="range-form"
                    name="from"
                    type="date"
                    defaultValue={from}
                    className="field tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="to-pick" className="label">
                    종료일
                  </label>
                  <input
                    id="to-pick"
                    form="range-form"
                    name="to"
                    type="date"
                    defaultValue={to}
                    className="field tabular-nums"
                  />
                </div>
                <button type="submit" form="range-form" className="btn-ghost col-span-2">
                  이 기간으로 보기
                </button>
              </div>
            ) : (
              <p className="mt-2 text-caption tabular-nums text-ink-600">
                {formatDate(from)} — {formatDate(to)}
              </p>
            )}
          </div>

          {/* ── 담을 내용 ── */}
          <div className="rule pt-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="label mb-0 tabular-nums">
                {preset.maxPicks === 1
                  ? "사진 고르기"
                  : `담을 내용 ${picked.length}개`}
              </p>
              {picked.length > 1 && (
                <Link
                  href={url({ sort: desc ? undefined : "desc" })}
                  className="tap shrink-0 text-caption font-bold text-brand-800 underline underline-offset-2"
                >
                  {desc ? "오래된 순으로" : "최신 순으로"}
                </Link>
              )}
            </div>

            {picked.length === 0 ? (
              <p className="rounded-control bg-ink-50 px-4 py-4 text-center text-body leading-relaxed text-ink-600">
                {preset.photoOnly ? (
                  <>
                    이 기간에 <b>사진이 있는 기록</b>이 없습니다.
                    <br />
                    {preset.name}은 사진으로 만들기 때문에, 사진을 넣은 기록이
                    한 건은 있어야 합니다.
                    <br />
                    기간을 넓히거나 아래에서 사진과 함께 기록을 남겨 주세요.
                  </>
                ) : (
                  <>
                    이 기간에 담을 기록이 없습니다.
                    <br />
                    기간을 넓히거나 아래에서 기록을 새로 남겨 주세요.
                  </>
                )}
              </p>
            ) : (
              <>
                <p className="mb-3 text-caption leading-relaxed text-ink-600">
                  {preset.pickHint
                    ? `${preset.pickHint} 내용을 고치려면 각 줄의 「고치기」를 누르면 됩니다.`
                    : "빼고 싶은 기록은 체크를 풀어 주세요. 내용을 고치려면 각 줄의 「고치기」를 누르면 됩니다."}
                </p>
                {preset.layout === "table" ? (
                  <TablePages records={shown} petId={pet.id} back={here} />
                ) : (
                  <StoryPages
                    records={shown}
                    quiet={preset.layout === "quiet"}
                    petId={pet.id}
                    back={here}
                  />
                )}
              </>
            )}

            {/* 책을 만들다 보면 "그날 사진도 넣고 싶은데"가 생긴다. 기록 화면을
               찾아 들어갔다 돌아오게 하지 않고 여기서 바로 열어 준다. */}
            <Link
              href={`/pets/${pet.id}?next=${encodeURIComponent(here)}#new-record`}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-ink-400 px-4 py-3.5 text-body font-bold text-ink-700 transition hover:bg-ink-50"
            >
              <span aria-hidden className="text-lg leading-none">
                +
              </span>
              사진과 함께 기록 추가하기
            </Link>
          </div>

          <p className="text-caption leading-relaxed text-ink-600">
            {preset.photoOnly
              ? `${preset.name}에는 사진이 있는 기록만 쓸 수 있습니다.`
              : `${preset.name}에는 ${preset.kinds
                  .map((k) => RECORD_KIND[k].label)
                  .join("·")} 기록이 들어갑니다.`}
          </p>
        </div>

        <div className="shrink-0 border-t border-ink-200 bg-white px-4 py-3">
          <button
            type="submit"
            disabled={picked.length === 0}
            className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            이대로 주문하기
          </button>
          <p className="mt-1.5 text-center text-caption text-ink-600">
            데모라 결제·배송은 진행되지 않습니다. 주문 접수와 제작 상태만
            기록됩니다.
          </p>
        </div>
      </form>
    </>
  );
}

/** 체크를 풀면 그 기록만 책에서 빠진다. 기본은 전부 담긴 상태. */
function IncludeToggle({ id }: { id: string }) {
  return (
    <label className="tap shrink-0 cursor-pointer gap-1.5 text-label font-bold text-ink-600">
      <input
        type="checkbox"
        name="record"
        value={id}
        defaultChecked
        className="h-4 w-4 accent-brand-700"
      />
      담기
    </label>
  );
}

function EditLink({
  petId,
  recordId,
  back,
}: {
  petId: string;
  recordId: string;
  back: string;
}) {
  return (
    <Link
      href={`/pets/${petId}?edit=${recordId}&next=${encodeURIComponent(back)}`}
      className="tap shrink-0 text-label font-bold text-ink-600 underline underline-offset-2 hover:text-ink-900"
    >
      고치기
    </Link>
  );
}

/* ═══════════════ 공통 ═══════════════ */

function StepFooter({ next }: { next: string }) {
  return (
    <div className="shrink-0 border-t border-ink-200 bg-white px-4 py-3">
      <button type="submit" className="btn-primary w-full py-3.5">
        {next}
      </button>
    </div>
  );
}

/** 성장 스토리북·추모 앨범 — 사진과 글이 함께 흐르는 구성 */
function StoryPages({
  records,
  quiet,
  petId,
  back,
}: {
  records: PetRecord[];
  quiet: boolean;
  petId: string;
  back: string;
}) {
  return (
    <ol className={`mt-2 ${quiet ? "space-y-5" : "space-y-2"}`}>
      {records.map((r, i) => (
        <li
          key={r.id}
          /* 체크를 풀면 옅어져서, 빠진 줄이 한눈에 보인다 (색이 아니라 농도로).
             :has(:not(:checked))로 쓰면 카드 안의 <p>·<img>가 전부 걸려 항상
             참이 된다. input으로 한정해야 '체크 풀린 줄'만 옅어진다. */
          className={`card border border-ink-200 transition has-[input:not(:checked)]:opacity-45 ${
            quiet ? "px-5 py-6" : "px-4 py-3.5"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-label tabular-nums text-ink-600">
              {formatDate(r.recordedAt)} · {i + 1}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <EditLink petId={petId} recordId={r.id} back={back} />
              <IncludeToggle id={r.id} />
            </div>
          </div>
          <div className={`flex gap-3 ${quiet ? "flex-col" : ""}`}>
            {quiet ? (
              <PhotoTile photo={r.photo} size={96} radius={8} className="h-24 w-full" />
            ) : (
              <PhotoTile photo={r.photo} size={56} />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-ink-900 ${quiet ? "text-body" : "text-caption"}`}>
                {r.title}
              </p>
              {r.note && (
                <p className={`mt-1 text-caption text-ink-700 ${quiet ? "leading-7" : ""}`}>
                  {r.note}
                </p>
              )}
              {r.weightKg !== null && (
                <p className="mt-1 text-label font-bold tabular-nums text-ink-700">
                  {r.weightKg}kg
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** 건강수첩 — 진료실에서 훑어볼 수 있도록 표로 */
function TablePages({
  records,
  petId,
  back,
}: {
  records: PetRecord[];
  petId: string;
  back: string;
}) {
  return (
    <div className="card mt-2 overflow-hidden border border-ink-200">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-caption tabular-nums">
          <caption className="sr-only">
            기간 내 증상 확인·병원·접종·체중·훈련 기록 목록. 각 줄의 체크를 풀면
            그 기록은 책에서 빠집니다.
          </caption>
          <thead className="border-b border-ink-200 bg-ink-50 text-label text-ink-600">
            <tr>
              <th scope="col" className="px-3 py-2 font-bold">담기</th>
              <th scope="col" className="px-3 py-2 font-bold">날짜</th>
              <th scope="col" className="px-3 py-2 font-bold">구분</th>
              <th scope="col" className="px-3 py-2 font-bold">내용</th>
              <th scope="col" className="px-3 py-2 text-right font-bold">체중</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr
                key={r.id}
                className="border-b border-ink-100 transition last:border-0 has-[input:not(:checked)]:opacity-45"
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    name="record"
                    value={r.id}
                    defaultChecked
                    aria-label={`${r.title} 담기`}
                    className="h-4 w-4 accent-brand-700"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-label text-ink-600">
                  {formatDate(r.recordedAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-label font-bold ${RECORD_KIND[r.kind].chip}`}
                  >
                    {RECORD_KIND[r.kind].label}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-semibold text-ink-800">{r.title}</span>
                  {r.triage && (
                    <span className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 text-label font-bold text-ink-700">
                      {levelLabel(r.triage)}
                    </span>
                  )}
                  <span className="ml-2 inline-block">
                    <EditLink petId={petId} recordId={r.id} back={back} />
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-label font-bold text-ink-700">
                  {r.weightKg !== null ? `${r.weightKg}kg` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

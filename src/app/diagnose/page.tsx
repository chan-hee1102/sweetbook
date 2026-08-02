import Link from "next/link";
import { IconChevronLeft, IconExternal } from "@/components/icons";
import { PetForm } from "@/components/PetForm";
import { PetGate } from "@/components/PetGate";
import { PhotoTile } from "@/components/PhotoTile";
import { saveDiagnoseAction } from "@/lib/actions";
import { ASK_FALLBACK, askQuestion, QUICK_QUESTIONS } from "@/lib/ask";
import { ageText, SPECIES_LABEL } from "@/lib/labels";
import { listPets } from "@/lib/store";
import {
  DISCLAIMER,
  levelLabel,
  runTriage,
  SYMPTOM_GROUPS,
  symptomsFor,
} from "@/lib/triage";
import type { Pet, TriageLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * 증상 확인은 네 단계짜리 팝업이다.
 *
 *   1 누구를  →  2 어디가  →  3 더 궁금한 것(선택)  →  4 그래서 어떻게
 *
 * 한 화면에 전부 펼쳤더니 반려동물 선택·탭·자주찾는증상·증상 19개·자유입력이
 * 동시에 보였다. 급한 사람이 "어디부터 봐야 하지"를 먼저 정해야 하는 화면은
 * 실패한 화면이다. 한 번에 한 가지만 묻는다.
 *
 * 상태는 전부 URL에 있다. 뒤로가기가 그대로 '이전 단계'가 되고, 자바스크립트
 * 없이도 동작하며, 결과 화면을 그대로 공유할 수 있다.
 */

type SP = {
  pet?: string;
  step?: string;
  s?: string | string[];
  q?: string;
  quick?: string;
  /** 생활 정보 단계에서 직접 입력한 질문 */
  aq?: string;
  /** 팝업 안에서 등록하다 입력이 잘못됐을 때 */
  error?: string;
};

/* "newpet"은 세는 단계가 아니라 1단계의 곁가지다. 급해서 들어온 사람을
   등록 화면으로 내보냈다가 다시 찾아오게 하면 거기서 이탈한다. */
type Step = "pet" | "newpet" | "symptom" | "info" | "result";
const STEPS: Step[] = ["pet", "symptom", "info", "result"];
const STEP_TITLE: Record<Step, string> = {
  pet: "누구를 확인할까요?",
  newpet: "새로 등록하기",
  symptom: "어디가 안 좋나요?",
  info: "더 궁금한 것이 있나요?",
  result: "확인 결과",
};

const LEVEL_STYLE: Record<
  TriageLevel,
  { box: string; eyebrow: string; head: string; body: string; dot: string }
> = {
  emergency: {
    box: "bg-triage-emergency",
    eyebrow: "text-triage-emergency-eyebrow",
    head: "text-white",
    body: "text-triage-emergency-ink",
    dot: "bg-white",
  },
  soon: {
    box: "border-l-4 border-triage-soon bg-white",
    eyebrow: "text-triage-soon",
    head: "text-ink-900",
    body: "text-ink-600",
    dot: "bg-triage-soon",
  },
  watch: {
    box: "bg-white",
    eyebrow: "text-ink-500",
    head: "text-ink-900",
    body: "text-ink-600",
    dot: "bg-triage-watch",
  },
};

/** 다음 단계로 넘길 때 지금까지 고른 값을 전부 들고 간다. */
function query(sp: SP, step: Step): string {
  const p = new URLSearchParams();
  if (sp.pet) p.set("pet", sp.pet);
  ([] as string[]).concat(sp.s ?? []).forEach((v) => p.append("s", v));
  if (sp.q) p.set("q", sp.q);
  if (sp.quick) p.set("quick", sp.quick);
  if (sp.aq) p.set("aq", sp.aq);
  p.set("step", step);
  return `/diagnose?${p.toString()}`;
}

export default function DiagnosePage({ searchParams }: { searchParams: SP }) {
  const pets = listPets();

  if (pets.length === 0) {
    return (
      <PetGate
        title="누구를 확인할까요?"
        description="증상 판정은 종과 나이에 따라 달라집니다. 확인할 반려동물을 먼저 등록해 주세요."
        next="/diagnose"
      />
    );
  }

  const pet = pets.find((p) => p.id === searchParams.pet) ?? null;
  const selected = ([] as string[]).concat(searchParams.s ?? []);
  const freeText = (searchParams.q ?? "").trim();
  const quickId = searchParams.quick ?? null;
  const askText = (searchParams.aq ?? "").trim();

  const raw = searchParams.step as Step | undefined;
  /**
   * 단계 결정.
   *
   * 반려동물이 없으면 무조건 1단계다 — 주소를 직접 쳐도 건너뛸 수 없다.
   * step이 없더라도 주소에 값이 있으면 그 값에 맞는 단계로 보낸다.
   * 기록 화면의 '증상 확인' 버튼(/diagnose?pet=…)이 반려동물 선택으로
   * 되돌아가면 안 되고, 결과 주소를 그대로 공유해도 결과가 보여야 한다.
   */
  const step: Step =
    searchParams.step === "newpet"
      ? "newpet"
      : !pet
        ? "pet"
        : raw && STEPS.includes(raw)
          ? raw
          : selected.length > 0 || freeText
            ? "result"
            : "symptom";

  // 등록은 아직 1단계 안이다 — 막대를 앞으로 밀지 않는다.
  const index = step === "newpet" ? 1 : STEPS.indexOf(step) + 1;
  const back =
    step === "symptom"
      ? query(searchParams, "pet")
      : step === "info"
        ? query(searchParams, "symptom")
        : step === "result"
          ? query(searchParams, "info")
          : step === "newpet"
            ? "/diagnose?step=pet"
            : null;

  return (
    <div className="sheet">
      <div className="sheet-panel">
        <div className="sheet-body">
          {/* ── 헤더 ── */}
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
                증상 확인 · {index} / {STEPS.length}
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

          {/* ── 진행 표시 ── */}
          <ol
            aria-hidden
            className="flex shrink-0 gap-1 px-4 pt-3"
          >
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  i < index ? "bg-brand-700" : "bg-ink-200"
                }`}
              />
            ))}
          </ol>

          {(searchParams.error === "name" || searchParams.error === "species") && (
            <p
              role="alert"
              className="mx-4 mt-3 rounded-control bg-rose-50 px-4 py-3 text-caption font-semibold text-rose-800"
            >
              {searchParams.error === "name"
                ? "이름이 비어 있습니다. 부르는 이름을 적어 주세요."
                : "강아지인지 고양이인지 골라 주세요."}
            </p>
          )}

          {step === "pet" && <StepPet pets={pets} sp={searchParams} />}
          {step === "newpet" && <StepNewPet />}
          {step === "symptom" && pet && (
            <StepSymptom pet={pet} sp={searchParams} selected={selected} freeText={freeText} />
          )}
          {step === "info" && pet && (
            <StepInfo sp={searchParams} quickId={quickId} askText={askText} />
          )}
          {step === "result" && pet && (
            <StepResult
              pet={pet}
              selected={selected}
              freeText={freeText}
              quickId={quickId}
              askText={askText}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 1단계 — 반려동물 ═══════════════ */

/* ═══════════════ 곁가지 — 팝업 안에서 등록 ═══════════════ */

function StepNewPet() {
  /* 등록이 끝나면 createPetAction이 next에 새 아이의 id를 붙여 돌려보낸다.
     그래서 저장하는 순간 그 아이의 증상 확인이 곧바로 이어진다. */
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="mb-4 text-caption leading-relaxed text-ink-600">
        이름과 종만 있으면 등록됩니다. 나머지는 나중에 채워도 됩니다. 등록하면
        바로 이 아이의 증상 확인으로 이어집니다.
      </p>
      <PetForm next="/diagnose?step=symptom" back="/diagnose?step=newpet" compact />
    </div>
  );
}

function StepPet({ pets, sp }: { pets: Pet[]; sp: SP }) {
  return (
    <form method="get" action="/diagnose" className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="step" value="symptom" />

      {/* 가로 스크롤 대신 격자로 편다. 스크롤바가 보이면 콘텐츠가 잘린 것처럼
          읽히고, 옆으로 밀어야 한다는 걸 모르는 사람은 뒤쪽 아이를 못 본다. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2.5">
          {pets.map((p, i) => (
            <label key={p.id} className="cursor-pointer">
              <input
                type="radio"
                name="pet"
                value={p.id}
                required
                defaultChecked={sp.pet ? p.id === sp.pet : i === 0}
                className="peer sr-only"
              />
              <span className="flex h-full flex-col items-center gap-2 rounded-card border border-ink-300 bg-white px-3 py-4 text-center transition peer-checked:border-2 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                <PhotoTile photo={p.photo} name={p.name} size={56} radius={999} />
                <span className="text-body font-bold text-ink-900">{p.name}</span>
                <span className="text-caption leading-tight text-ink-600">
                  {SPECIES_LABEL[p.species]}
                  {p.breed ? ` · ${p.breed}` : ""}
                  {ageText(p.birth, p.passedAt) && (
                    <>
                      <br />
                      {ageText(p.birth, p.passedAt)}
                    </>
                  )}
                </span>
              </span>
            </label>
          ))}

          <Link
            href="/diagnose?step=newpet"
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

/* ═══════════════ 2단계 — 증상 ═══════════════ */

function StepSymptom({
  pet,
  sp,
  selected,
  freeText,
}: {
  pet: Pet;
  sp: SP;
  selected: string[];
  freeText: string;
}) {
  const available = symptomsFor(pet.species);

  return (
    <form method="get" action="/diagnose" className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="pet" value={pet.id} />
      <input type="hidden" name="step" value="info" />
      {sp.quick && <input type="hidden" name="quick" value={sp.quick} />}

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <p className="text-caption text-ink-600">
          {pet.name}에게 보이는 증상을 모두 골라 주세요. 여러 개 골라도 됩니다.
        </p>

        {SYMPTOM_GROUPS.map((group) => {
          const items = available.filter((s) => s.group === group);
          if (items.length === 0) return null;
          return (
            <fieldset key={group}>
              <legend className="label">{group}</legend>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <label key={s.id} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="s"
                      value={s.id}
                      defaultChecked={selected.includes(s.id)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-[44px] items-center rounded-control border border-ink-300 bg-white px-3 text-body text-ink-700 transition peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-bold peer-checked:text-brand-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <div>
          <label htmlFor="q" className="label">
            그 밖에 적어둘 내용 <span className="font-normal text-ink-500">(선택)</span>
          </label>
          <textarea
            id="q"
            name="q"
            rows={3}
            defaultValue={freeText}
            placeholder="예) 어제 저녁부터 기침을 하고, 산책 나가면 더 심해져요"
            className="field resize-none"
          />
          <p className="mt-1.5 text-caption leading-relaxed text-ink-600">
            무언가를 삼킨 상황이면 무엇을, 언제, 얼마나 먹었는지 적어 주세요. 응급
            판정에 바로 반영됩니다.
          </p>
        </div>
      </div>

      <StepFooter next="다음" />
    </form>
  );
}

/* ═══════════════ 3단계 — 생활 정보 (선택) ═══════════════ */

function StepInfo({
  sp,
  quickId,
  askText,
}: {
  sp: SP;
  quickId: string | null;
  askText: string;
}) {
  return (
    <form method="get" action="/diagnose" className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="pet" value={sp.pet ?? ""} />
      {([] as string[]).concat(sp.s ?? []).map((v) => (
        <input key={v} type="hidden" name="s" value={v} />
      ))}
      {sp.q && <input type="hidden" name="q" value={sp.q} />}
      <input type="hidden" name="step" value="result" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-caption leading-relaxed text-ink-600">
          평소 궁금했던 것이 있으면 하나 골라 주세요. 결과와 함께 답을 보여드립니다.
          <br />
          <span className="font-semibold text-ink-500">
            고르지 않고 넘어가도 됩니다.
          </span>
        </p>

        <div className="mt-4 space-y-2">
          {QUICK_QUESTIONS.map((qq) => (
            <label key={qq.id} className="block cursor-pointer">
              <input
                type="radio"
                name="quick"
                value={qq.id}
                defaultChecked={qq.id === quickId}
                className="peer sr-only"
              />
              <span className="flex min-h-[52px] items-center rounded-control border border-ink-300 bg-white px-4 text-body text-ink-700 transition peer-checked:border-2 peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-bold peer-checked:text-brand-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                {qq.display}
              </span>
            </label>
          ))}
        </div>

        <div className="rule mt-5 pt-4">
          <label htmlFor="aq" className="label">
            직접 물어보기 <span className="font-normal text-ink-500">(선택)</span>
          </label>
          <input
            id="aq"
            name="aq"
            defaultValue={askText}
            placeholder="예) 예방접종은 몇 차까지 맞아야 하나요?"
            className="field"
          />
          <p className="mt-1.5 text-caption leading-relaxed text-ink-600">
            가지고 있는 자료에서 답을 찾지 못하면, 지어내지 않고 못 찾았다고
            말씀드립니다.
          </p>
        </div>
      </div>

      <StepFooter next="결과 보기" />
    </form>
  );
}

/* ═══════════════ 4단계 — 결과 ═══════════════ */

function StepResult({
  pet,
  selected,
  freeText,
  quickId,
  askText,
}: {
  pet: Pet;
  selected: string[];
  freeText: string;
  quickId: string | null;
  askText: string;
}) {
  const hasInput = selected.length > 0 || freeText.length > 0;
  const result = hasInput ? runTriage({ pet, symptomIds: selected, freeText }) : null;
  const ask =
    quickId || askText ? askQuestion({ pet, quickId, freeText: askText }) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!result && (
          <div className="card border border-ink-300 px-4 py-5">
            <p className="text-body font-bold text-ink-900">고른 증상이 없습니다</p>
            <p className="mt-1.5 text-caption text-ink-600">
              이전 단계에서 증상을 고르거나 상황을 적어 주세요.
            </p>
          </div>
        )}

        {result && <TriageResult pet={pet} result={result} freeText={freeText} />}

        {ask && (
          <section className="space-y-3 pt-2">
            <div className="rule pt-4">
              <p className="text-label font-bold text-ink-500">추가로 물어보신 것</p>
              <p className="mt-1 text-body font-bold text-ink-900">{ask.question}</p>
            </div>

            {!ask.answered ? (
              <div className="card border border-ink-200 px-4 py-4">
                <p className="text-body font-bold text-ink-800">
                  이 질문에 답할 자료가 없습니다
                </p>
                <p className="mt-1.5 text-caption leading-relaxed text-ink-600">
                  {ASK_FALLBACK}
                </p>
              </div>
            ) : (
              <>
                {ask.breedMissing && (
              /* 품종 자료가 없을 때. 침묵하면 사용자는 이유를 추측해야 한다. */
              <div className="rounded-control border border-ink-300 bg-ink-50 px-4 py-3">
                <p className="text-caption font-bold text-ink-800">
                  {ask.breedMissing} 자료는 아직 준비 중입니다
                </p>
                <p className="mt-1 text-caption leading-relaxed text-ink-600">
                  품종별 주의사항은 공개 수의학 자료가 있는 품종만 싣고 있어서,
                  아직 {ask.breedMissing}는 들어 있지 않습니다. 위 안내는 품종과
                  무관하게 {"{"}종·나이 기준{"}"}으로 확인한 결과이며, 품종에 따른
                  주의사항은 동물병원에서 확인해 주세요.
                </p>
              </div>
            )}

            {ask.breedNote && (
                  <div className="rounded-card border border-brand-300 bg-brand-50 px-4 py-4">
                    <p className="text-label font-bold text-brand-800">
                      {pet.name} · {ask.breedNote.item.breed}
                    </p>
                    <p className="mt-1.5 text-body text-brand-900">
                      {ask.breedNote.evidence}
                    </p>
                    <Source
                      org={ask.breedNote.item.source_org}
                      title={ask.breedNote.item.source_title}
                      url={ask.breedNote.item.source_url}
                      tone="text-brand-800"
                    />
                  </div>
                )}
                <Evidence hits={ask.hits} />
              </>
            )}
          </section>
        )}

        <p className="px-1 pt-2 text-caption leading-relaxed text-ink-600">{DISCLAIMER}</p>
      </div>

      {result && (
        <form
          action={saveDiagnoseAction}
          className="shrink-0 border-t border-ink-200 bg-white px-4 py-3"
        >
          <input type="hidden" name="petId" value={pet.id} />
          <input type="hidden" name="level" value={result.level} />
          <input
            type="hidden"
            name="title"
            value={`증상 확인 · ${levelLabel(result.level)}`}
          />
          <input
            type="hidden"
            name="note"
            value={
              result.matchedSymptoms.map((s) => s.label).join(", ") ||
              (freeText ? `직접 입력: ${freeText.slice(0, 40)}` : "")
            }
          />
          <button type="submit" className="btn-primary w-full py-3.5">
            {pet.name} 기록에 저장하기
          </button>
          <p className="mt-1.5 text-center text-caption text-ink-600">
            저장하면 건강수첩에 한 줄로 들어갑니다.
          </p>
        </form>
      )}
    </div>
  );
}

function TriageResult({
  pet,
  result,
  freeText,
}: {
  pet: Pet;
  result: ReturnType<typeof runTriage>;
  freeText: string;
}) {
  const st = LEVEL_STYLE[result.level];
  const mapQuery = result.level === "emergency" ? "24시 동물병원" : "동물병원";

  return (
    <>
      <div className={`rounded-panel px-5 py-6 ${st.box}`}>
        <p className={`flex items-center gap-1.5 text-label font-bold ${st.eyebrow}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${st.dot}`} />
          {pet.name} · {levelLabel(result.level)}
        </p>
        <h2 className={`mt-1.5 text-title font-extrabold ${st.head}`}>
          {result.headline}
        </h2>
        <p className={`mt-2 text-body ${st.body}`}>{result.action}</p>

        {result.level !== "watch" && (
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noreferrer noopener"
            className={`btn mt-5 w-full ${
              result.level === "emergency"
                ? "bg-white text-triage-emergency hover:bg-ink-50"
                : "border border-triage-soon bg-white text-triage-soon hover:bg-ink-50"
            }`}
          >
            {result.level === "emergency"
              ? "지금 문 연 24시 동물병원 찾기"
              : "근처 동물병원 찾기"}
            <IconExternal size={16} />
          </a>
        )}
      </div>

      {result.reasons.length > 0 && (
        <div className="card border border-ink-200 px-4 py-4">
          <h3 className="text-label font-bold text-ink-500">이 판정에 적용한 규칙</h3>
          <ul className="mt-2 space-y-1.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex gap-2 text-caption leading-relaxed text-ink-700">
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400"
                />
                <span>
                  <span className="font-bold text-ink-900">{r.rule}</span> · {r.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Evidence hits={result.evidence} />
      {freeText && (
        <p className="px-1 text-caption text-ink-500">
          적어주신 내용: {freeText}
        </p>
      )}
    </>
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

function Evidence({
  hits,
}: {
  hits: {
    id: string;
    evidence: string;
    source_org: string | null;
    source_title: string | null;
    source_url: string | null;
  }[];
}) {
  if (hits.length === 0) return null;
  return (
    <div className="card border border-ink-200 px-4 py-4">
      <h3 className="text-label font-bold text-ink-500">근거로 삼은 수의학 자료</h3>
      <ul className="mt-2.5 space-y-3">
        {hits.map((h) => (
          <li key={h.id} className="border-l-2 border-ink-300 pl-3">
            <p className="text-caption leading-relaxed text-ink-700">{h.evidence}</p>
            <Source org={h.source_org} title={h.source_title} url={h.source_url} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Source({
  org,
  title,
  url,
  tone = "text-ink-600",
}: {
  org: string | null;
  title: string | null;
  url: string | null;
  tone?: string;
}) {
  const label = [org, title].filter(Boolean).join(" · ");
  if (!label) return null;
  return (
    <p className={`mt-1.5 text-label leading-relaxed ${tone}`}>
      출처{" "}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-bold underline underline-offset-2 hover:opacity-70"
        >
          {label}
          <span className="sr-only"> (새 창에서 열림)</span>
        </a>
      ) : (
        label
      )}
    </p>
  );
}

import Link from "next/link";
import { IconArrowRight, IconChevronRight, IconStethoscope } from "@/components/icons";
import { loadSampleAction } from "@/lib/actions";
import { BOOK_ORDER, BOOK_PRESETS, GOODS_ORDER } from "@/lib/books";
import { knowledgeStats } from "@/lib/knowledge";
import { listPets } from "@/lib/store";
import type { BookType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function HomePage({
  searchParams,
}: {
  searchParams: { sample?: string; cleared?: string };
}) {
  const pets = listPets();
  const stats = knowledgeStats();

  return (
    // 히어로와 부가 기능 사이는 넓게, 부가 기능끼리는 좁게 — 간격이 곧 위계다
    <div className="space-y-6">
      {searchParams.sample && (
        <p
          role="status"
          className="rounded-control bg-brand-50 px-4 py-3 text-body font-semibold text-brand-800"
        >
          예시 데이터를 넣었습니다. 반려동물 3마리와 기록 49건을 둘러보실 수 있습니다.
        </p>
      )}
      {searchParams.cleared && (
        <p
          role="status"
          className="rounded-control bg-ink-100 px-4 py-3 text-body font-semibold text-ink-700"
        >
          모든 데이터를 비웠습니다.
        </p>
      )}

      {/* ── 메인 진입점 ──
          이 서비스에 사람들이 들어오는 이유는 "우리 애가 기침을 해요" 같은
          검색이다. 그래서 첫 화면의 가장 큰 버튼은 증상 확인이다. */}
      <section>
        {/* 한 줄로 유지한다. 다만 nowrap은 넘칠 때 줄을 바꾸는 대신 화면 밖으로
            밀어내므로, 최소 크기가 너무 크면 가로 스크롤이 생긴다.
            이 문장은 약 17.5em이고 좌우 여백이 40px이라
            (100vw − 40px) ÷ 17.5 이하로 잡아야 320px 기기에서도 안 잘린다. */}
        <h1
          className="whitespace-nowrap font-extrabold leading-[1.3] tracking-tight text-ink-900"
          style={{ fontSize: "clamp(15px, 4.8vw, 29px)" }}
        >
          지금 병원에 가야 할지 먼저 확인하세요
        </h1>

        <Link
          href="/diagnose"
          className="btn-hero group mt-5 flex items-center gap-4 rounded-card px-5 py-7 text-white"
        >
          <IconStethoscope size={42} className="shrink-0" />
          {/* 제목과 예시를 한 줄에 둔다. 베이스라인을 맞춰야 크기가 다른 두 글자가
              같은 줄에 앉은 것으로 읽힌다.
              예시는 폭이 좁으면(<440px) 감춘다 — 줄바꿈시키거나 잘라 보이느니
              큰 제목만 남기는 편이 낫다. */}
          <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
            <span
              className="shrink-0 font-extrabold leading-none tracking-tight"
              style={{ fontSize: "clamp(25px, 7vw, 33px)" }}
            >
              증상 확인하기
            </span>
            {/* '등'이 없으면 이 넷이 전부인 것처럼 읽힌다. 실제로는 19가지다. */}
            <span className="hidden truncate text-caption text-brand-100 min-[440px]:block">
              기침, 구토, 설사, 절뚝임 등
            </span>
          </span>
          <IconArrowRight
            size={20}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>

        {/* 이 서비스가 다른 검색 결과와 다른 유일한 지점이므로 CTA 바로 밑에 둔다 */}
        <p className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-caption font-semibold text-brand-800">
          근거 자료 {stats.total}건 · 출처 기관 {stats.orgs}곳
        </p>
        <p className="mt-1.5 text-caption text-ink-600">
          판단에 쓴 수의학 자료와 출처를 함께 볼 수 있습니다.
        </p>
      </section>

      {/* ── 부가 기능 ──
          확인한 기록이 쌓이면 책이 된다. 진단이 입구, 기록이 본체, 책이 출구. */}
      <section>
        {/* '책 만들기'는 시스템이 하는 일이고, '책으로 남기다'는 보호자가 원하는
            일이다. 제목은 후자로 쓴다. '함께한'은 성장·건강·추모 세 권을 모두
            덮으면서, 추모 앨범에서도 어색해지지 않는 유일한 수식이다. */}
        <h2 className="mb-2.5 text-caption font-bold text-ink-500">
          함께한 기록을 책으로
        </h2>

        <ProductRow types={BOOK_ORDER} />
      </section>

      {/* ── 사진으로 만드는 것 ──
          책은 '기록을 엮는' 물건이고 이쪽은 '사진 한 장을 크게 쓰는' 물건이다.
          같은 줄에 6개를 늘어놓으면 무엇이 본체인지 흐려지므로 단을 나눈다. */}
      <section>
        <h2 className="mb-2.5 text-caption font-bold text-ink-500">
          사진 한 장으로 만들기
        </h2>
        <ProductRow types={GOODS_ORDER} />
      </section>

      {/* 반려동물 목록은 홈에서 뺐다.
          이 서비스는 등록해 두고 매일 들여다보는 앱이 아니라, 들어와서 곧바로
          기능을 쓰는 흐름이다. 등록은 각 기능의 팝업 1단계가 맡는다.
          홈에 목록을 두면 "먼저 등록부터 해야 하나?"라는 단계를 하나 더 만든다.

          다만 아무것도 없는 첫 방문자에게는 둘러볼 길을 열어 둔다. */}
      {pets.length === 0 && (
        <section className="card px-5 py-6 text-center">
          <p className="text-body leading-relaxed text-ink-700">
            위 기능을 누르면 반려동물을 등록하는 창이 바로 열립니다.
            <br />
            로그인은 필요 없습니다.
          </p>
          <form action={loadSampleAction} className="mt-4">
            <button type="submit" className="btn-ghost w-full">
              예시 데이터로 둘러보기
            </button>
          </form>
          <p className="mt-2.5 text-caption leading-relaxed text-ink-500">
            둘러보기를 누르면 반려동물 3마리와 기록 49건이 들어가, 전 기능을 바로
            확인하실 수 있습니다.
          </p>
        </section>
      )}

    </div>
  );
}

/**
 * 만들 수 있는 것 3개를 한 줄로.
 *
 * 가로 3개가 기본. 폭이 좁으면(≤379px) 세로로 쌓이면서 원과 이름이 나란히
 * 눕는다 — 좁은 화면에서 원 밑에 이름을 두면 세로로만 길어진다.
 */
function ProductRow({ types }: { types: BookType[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 min-[380px]:gap-2.5">
      {types.map((type) => {
        const preset = BOOK_PRESETS[type];
        const Icon = preset.Icon;
        return (
          <Link
            key={type}
            href={`/books/${type}`}
            className="group card flex items-center gap-3 px-3.5 py-2.5 transition hover:bg-ink-50 min-[380px]:flex-col min-[380px]:gap-2 min-[380px]:px-2 min-[380px]:py-3"
          >
            <span
              className="book-orb h-11 w-11"
              style={{ "--orb": preset.spine } as React.CSSProperties}
            >
              <Icon size={21} />
            </span>
            <span className="min-w-0 flex-1 min-[380px]:flex-none min-[380px]:text-center">
              <span className="block text-caption font-bold text-ink-800 min-[380px]:text-label">
                {preset.name}
              </span>
              <span className="mt-0.5 block text-caption text-ink-600 min-[380px]:hidden">
                {preset.tagline}
              </span>
            </span>
            <IconChevronRight size={18} className="text-ink-400 min-[380px]:hidden" />
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createPetAction } from "@/lib/actions";
import { PhotoInput } from "./PhotoInput";

/**
 * 반려동물 등록 폼.
 *
 * 사진을 넣지 않아도 등록이 끝나야 한다 — 급해서 들어온 사람에게 사진부터
 * 요구하면 거기서 이탈한다. 필수는 이름과 종 둘뿐이다.
 * (사진 처리 규칙은 PhotoInput에 모아 기록 작성과 공유한다)
 */

export function PetForm({
  next,
  back,
  compact = false,
}: {
  /** 등록 후 돌아갈 곳. 증상 확인하러 왔다면 그 화면으로 돌려보낸다. */
  next?: string;
  /** 입력이 잘못됐을 때 되돌아올 자리. 팝업 안에서 쓸 때 필요하다. */
  back?: string;
  compact?: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <form action={createPetAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {back && <input type="hidden" name="back" value={back} />}

      <PhotoInput
        initialLabel={name}
        hint="선택 사항입니다. 넣지 않으면 이름 첫 글자가 들어갑니다."
      />

      {/* ── 이름 ── */}
      <div>
        <label htmlFor="name" className="label">
          이름 <span className="text-triage-emergency">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 몽이"
          className="field"
        />
      </div>

      {/* ── 종 ── */}
      <fieldset>
        <legend className="label">
          종 <span className="text-triage-emergency">*</span>
        </legend>
        <div className="flex gap-2">
          {[
            { v: "dog", t: "강아지" },
            { v: "cat", t: "고양이" },
          ].map((o, i) => (
            <label key={o.v} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="species"
                value={o.v}
                defaultChecked={i === 0}
                className="peer sr-only"
                required
              />
              <span className="flex min-h-[44px] items-center justify-center rounded-control border border-ink-300 bg-white text-body text-ink-700 transition peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-bold peer-checked:text-brand-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-700">
                {o.t}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-caption text-ink-500">
          종에 따라 확인하는 증상과 참고하는 자료가 달라집니다.
        </p>
      </fieldset>

      {/* ── 생년월일 · 성별 ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="birth" className="label">
            태어난 날
          </label>
          <input id="birth" name="birth" type="date" className="field tabular-nums" />
        </div>
        <div>
          <label htmlFor="sex" className="label">
            성별
          </label>
          <select id="sex" name="sex" className="field" defaultValue="">
            <option value="">모름</option>
            <option value="male">수컷</option>
            <option value="female">암컷</option>
          </select>
        </div>
      </div>

      {/* ── 품종 · 체중 ── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="breed" className="label">
            품종
          </label>
          <input
            id="breed"
            name="breed"
            placeholder="예) 말티즈"
            className="field"
            list="breed-suggestions"
          />
          <datalist id="breed-suggestions">
            {["말티즈","푸들","포메라니안","시츄","비숑프리제","웰시코기","골든리트리버","진돗개","코리안숏헤어","러시안블루","스코티시폴드","페르시안"].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="weightKg" className="label">
            체중 (kg)
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            min="0"
            placeholder="3.4"
            className="field tabular-nums"
          />
        </div>
      </div>

      {/* ── 중성화 ── */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="neutered"
          className="h-5 w-5 rounded border-ink-500 accent-brand-700"
        />
        <span className="text-body text-ink-700">중성화를 했습니다</span>
      </label>

      {/* ── 특징 ── */}
      <div>
        <label htmlFor="traits" className="label">
          특징 <span className="font-normal text-ink-500">(선택)</span>
        </label>
        <textarea
          id="traits"
          name="traits"
          rows={2}
          placeholder="알레르기, 지병, 성격처럼 진료 때 말하게 되는 것"
          className="field resize-none"
        />
      </div>

      <button type="submit" className="btn-primary w-full py-3.5 text-body">
        등록하기
      </button>
      {!compact && (
        <p className="text-center text-caption text-ink-500">
          이름과 종만 있으면 등록됩니다. 나머지는 나중에 채워도 됩니다.
        </p>
      )}
    </form>
  );
}

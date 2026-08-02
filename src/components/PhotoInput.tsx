"use client";

import { useRef, useState } from "react";

/**
 * 사진 입력.
 *
 * 서버로 파일을 보내지 않고, 브라우저에서 정사각형으로 잘라 256px JPEG
 * data URL로 만든 뒤 hidden input에 담아 보낸다. 외부 스토리지 없이 동작해야
 * 하고, 원본을 그대로 저장하면 JSON 저장소가 금방 비대해지기 때문이다.
 *
 * 반려동물 등록과 기록 작성이 같은 규칙을 쓰도록 여기 한 곳에 뒀다.
 */

const MAX_PX = 256;

async function toSquareDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode"));
    el.src = dataUrl;
  });

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MAX_PX;
  canvas.height = MAX_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_PX, MAX_PX);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoInput({
  name = "photo",
  initial = null,
  initialLabel = "",
  hint = "선택 사항입니다.",
  size = 64,
}: {
  name?: string;
  /** 이미 있는 사진(수정할 때) */
  initial?: string | null;
  /** 사진이 없을 때 자리에 새길 글자 */
  initialLabel?: string;
  hint?: string;
  size?: number;
}) {
  const [photo, setPhoto] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setPhoto(await toSquareDataUrl(file));
    } catch {
      setError("이 이미지는 불러오지 못했습니다. 다른 사진을 골라 주세요.");
    }
  }

  const box = { width: size, height: size };

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={photo ?? ""} />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="shrink-0 rounded-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        aria-label="사진 고르기"
      >
        {photo ? (
          // 데이터 URL이라 next/image 최적화 대상이 아니다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" style={box} className="rounded-tile object-cover" />
        ) : (
          <span
            className="photo-blank flex rounded-tile"
            data-initial={initialLabel.trim().charAt(0)}
            style={{ ...box, "--tile": `${size}px` } as React.CSSProperties}
          />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost h-11 min-h-0 px-3 py-0 text-caption"
        >
          {photo ? "사진 바꾸기" : "사진 고르기"}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => {
              setPhoto(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="tap ml-2 text-caption font-semibold text-ink-600 underline underline-offset-2"
          >
            지우기
          </button>
        )}
        <p className="mt-1 text-caption text-ink-500">{hint}</p>
        {error && (
          <p role="alert" className="mt-1 text-caption font-semibold text-triage-emergency">
            {error}
          </p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

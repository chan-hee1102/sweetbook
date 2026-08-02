"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BOOK_PRESETS, isBookType, selectRecords } from "./books";
import {
  advanceOrder,
  clearAll,
  createOrder,
  createPet,
  createRecord,
  deleteRecord,
  getPet,
  listRecords,
  loadSampleData,
  updateRecord,
} from "./store";
import type { RecordKind, TriageLevel } from "./types";

const str = (fd: FormData, key: string) => (fd.get(key) ?? "").toString().trim();

/* ─────────────────────────── 주문 ─────────────────────────── */

export async function createOrderAction(formData: FormData) {
  const petId = str(formData, "petId");
  const type = str(formData, "bookType");
  const from = str(formData, "from");
  const to = str(formData, "to");
  const title = str(formData, "title");

  const back = `/books/${type}?pet=${petId}&from=${from}&to=${to}`;

  if (!isBookType(type)) redirect("/");
  const pet = getPet(petId);
  if (!pet) redirect(`/books/${type}`);

  if (!from || !to || from > to) {
    redirect(`${back}&error=period`);
  }

  const preset = BOOK_PRESETS[type];

  /* 마지막 화면에서 체크를 푼 기록은 책에서 빠져야 한다.
     그래서 기간으로 다시 계산하지 않고, 실제로 체크된 id만 받는다.
     다만 폼 값은 조작될 수 있으므로 이 반려동물의 · 이 책에 들어갈 수 있는 ·
     기간 안의 기록인지 서버에서 다시 확인한다. */
  const allowed = selectRecords(listRecords(petId), preset, from, to);
  const wanted = new Set(formData.getAll("record").map(String));
  const chosen = allowed.filter((r) => wanted.has(r.id));
  const picked = chosen.length > 0 ? chosen : allowed;

  // 담을 기록이 없으면 빈 책이 만들어진다. 주문 전에 막는다.
  if (picked.length === 0) {
    redirect(`${back}&error=empty`);
  }

  // 시간순이 기본이고, 최신 순으로 뒤집을 수 있다.
  let ordered = str(formData, "sort") === "desc" ? [...picked].reverse() : picked;

  // 굿즈는 장수가 정해져 있다 (액자·퍼즐 1장, 달력 12장).
  // 폼에서 더 보내와도 서버에서 자른다.
  if (preset.maxPicks) ordered = ordered.slice(0, preset.maxPicks);

  const order = createOrder({
    petId,
    bookType: type,
    title: title || preset.defaultTitle(pet),
    // 기간은 실제로 담긴 기록의 처음과 끝으로 적는다 — 고른 것과 표기가 어긋나지 않도록
    periodStart: ordered.reduce((a, r) => (r.recordedAt < a ? r.recordedAt : a), ordered[0].recordedAt),
    periodEnd: ordered.reduce((a, r) => (r.recordedAt > a ? r.recordedAt : a), ordered[0].recordedAt),
    recordIds: ordered.map((r) => r.id),
    option: str(formData, "option") || null,
  });

  revalidatePath("/orders");
  revalidatePath("/admin");
  redirect(`/orders/${order.id}?created=1`);
}

export async function advanceOrderAction(formData: FormData) {
  const orderId = str(formData, "orderId");
  advanceOrder(orderId);
  revalidatePath("/admin");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

/* ─────────────────────────── 기록 ─────────────────────────── */

export async function createRecordAction(formData: FormData) {
  const petId = str(formData, "petId");
  if (!getPet(petId)) redirect("/");

  // 책을 만들다가 빠진 기록을 여기서 채워 넣은 경우, 만들던 자리로 되돌린다.
  // 앱 내부 경로만 허용한다 (열린 리다이렉트 방지).
  const raw = str(formData, "next");
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";

  const title = str(formData, "title");
  if (!title) {
    const back = `/pets/${petId}?error=title`;
    redirect(next ? `${back}&next=${encodeURIComponent(next)}` : back);
  }

  const weightRaw = str(formData, "weightKg");
  const weight = weightRaw ? Number(weightRaw) : null;

  createRecord({
    petId,
    kind: (str(formData, "kind") || "daily") as RecordKind,
    title,
    note: str(formData, "note"),
    weightKg: weight !== null && Number.isFinite(weight) ? weight : null,
    photo: str(formData, "photo") || null,
    triage: null,
    recordedAt: str(formData, "recordedAt") || new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/pets/${petId}`);
  if (next) revalidatePath(next);
  redirect(next || `/pets/${petId}?saved=1`);
}

export async function updateRecordAction(formData: FormData) {
  const recordId = str(formData, "recordId");
  const petId = str(formData, "petId");
  const title = str(formData, "title");

  // 책을 만들다가 오탈자를 발견해 들어온 경우, 저장 후 만들던 자리로 되돌린다.
  // 앱 내부 경로만 허용한다 — 열린 리다이렉트가 되지 않도록.
  const raw = str(formData, "next");
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";

  if (!title) {
    const back = `/pets/${petId}?edit=${recordId}&error=title`;
    redirect(next ? `${back}&next=${encodeURIComponent(next)}` : back);
  }

  const weightRaw = str(formData, "weightKg");
  const weight = weightRaw ? Number(weightRaw) : null;

  updateRecord(recordId, {
    title,
    note: str(formData, "note"),
    kind: (str(formData, "kind") || "daily") as RecordKind,
    recordedAt: str(formData, "recordedAt") || undefined,
    weightKg: weight !== null && Number.isFinite(weight) ? weight : null,
  });

  revalidatePath(`/pets/${petId}`);
  if (next) revalidatePath(next);
  redirect(next || `/pets/${petId}?saved=edit`);
}

export async function deleteRecordAction(formData: FormData) {
  const recordId = str(formData, "recordId");
  const petId = str(formData, "petId");

  deleteRecord(recordId);

  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?deleted=1`);
}

/**
 * 증상 확인 결과를 기록으로 남긴다.
 *
 * 이 서비스의 핵심 연결고리다. 진단만 하고 나가면 콘텐츠가 쌓이지 않고,
 * 콘텐츠가 없으면 책도 만들 수 없다. 확인한 결과가 기록이 되어야
 * 건강수첩의 한 줄이 된다.
 */
export async function saveDiagnoseAction(formData: FormData) {
  const petId = str(formData, "petId");
  if (!getPet(petId)) redirect("/");

  createRecord({
    petId,
    kind: "diagnose",
    title: str(formData, "title") || "증상 확인",
    note: str(formData, "note"),
    weightKg: null,
    photo: null,
    triage: (str(formData, "level") || "watch") as TriageLevel,
    recordedAt: new Date().toISOString().slice(0, 10),
  });

  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}?saved=diagnose`);
}

/* ─────────────────────────── 반려동물 ─────────────────────────── */

export async function createPetAction(formData: FormData) {
  const name = str(formData, "name");
  const species = str(formData, "species");

  // 등록 폼이 팝업 안에 있을 수도 있다. 그럴 때 오류를 /pets/new로 보내면
  // 하려던 일에서 튕겨 나간다. 폼이 있던 자리로 되돌린다.
  const rawBack = str(formData, "back");
  const back =
    rawBack.startsWith("/") && !rawBack.startsWith("//") ? rawBack : "/pets/new";
  const withError = (code: string) =>
    `${back}${back.includes("?") ? "&" : "?"}error=${code}`;

  if (!name) redirect(withError("name"));
  if (species !== "dog" && species !== "cat") redirect(withError("species"));

  const weightRaw = str(formData, "weightKg");
  const weight = weightRaw ? Number(weightRaw) : null;
  const sexRaw = str(formData, "sex");

  const pet = createPet({
    name,
    species,
    breed: str(formData, "breed") || null,
    birth: str(formData, "birth") || null,
    sex: sexRaw === "male" || sexRaw === "female" ? sexRaw : null,
    neutered: str(formData, "neutered") === "on",
    weightKg: weight !== null && Number.isFinite(weight) ? weight : null,
    traits: str(formData, "traits") || null,
    // 업로드한 썸네일은 data URL로 들어온다. 외부 저장소를 쓰지 않기 위한 선택.
    photo: str(formData, "photo") || null,
    passedAt: str(formData, "passedAt") || null,
  });

  revalidatePath("/", "layout");

  // 등록하러 오기 전에 하려던 일이 있으면 그리로 돌려보낸다.
  const next = str(formData, "next");
  if (next.startsWith("/")) {
    redirect(`${next}${next.includes("?") ? "&" : "?"}pet=${pet.id}`);
  }
  redirect(`/pets/${pet.id}?created=1`);
}

/* ─────────────────────────── 예시 데이터 ─────────────────────────── */

export async function loadSampleAction(formData: FormData) {
  loadSampleData();
  revalidatePath("/", "layout");
  const next = str(formData, "next");
  redirect(next.startsWith("/") ? next : "/?sample=1");
}

export async function clearAllAction() {
  clearAll();
  revalidatePath("/", "layout");
  redirect("/?cleared=1");
}

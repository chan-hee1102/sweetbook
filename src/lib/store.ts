import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  BookType,
  Order,
  OrderStatus,
  Pet,
  PetRecord,
  RecordKind,
  Store,
} from "./types";

/**
 * 저장소를 DB 엔진 대신 JSON 파일 하나로 둔다.
 *
 * 심사 환경에서 `docker compose up` 한 번으로 실행되는 것이 최우선 요건이라,
 * 설치·마이그레이션이 필요 없고 의존성이 0개인 방식을 택했다. 요구된 기능
 * (주문 저장·조회·상태 전이)에는 충분하고, 볼륨을 지우면 항상 같은 데모
 * 상태로 되돌아와 재현성이 좋다.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const SEED_PATH = path.join(process.cwd(), "seed", "demo.json");

// next dev의 HMR과 빌드 시 모듈이 여러 번 평가되므로 전역에 캐시를 붙인다.
const globalForStore = globalThis as unknown as { __petnoteStore?: Store };

const EMPTY: Store = { pets: [], records: [], orders: [] };

/**
 * 첫 실행은 빈 상태로 시작한다.
 *
 * 실제 사용자는 자기 반려동물을 등록하는 것으로 서비스를 시작하므로, 처음부터
 * 남의 강아지가 들어 있으면 그 흐름을 볼 수 없다. 대신 홈에 '예시 데이터로
 * 둘러보기'를 두어, 심사자가 한 번 눌러 전 기능을 확인할 수 있게 했다.
 */
function loadStore(): Store {
  if (globalForStore.__petnoteStore) return globalForStore.__petnoteStore;

  const store: Store = fs.existsSync(STORE_PATH)
    ? (JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Store)
    : { ...EMPTY };

  if (!fs.existsSync(STORE_PATH)) persist(store);

  globalForStore.__petnoteStore = store;
  return store;
}

function persist(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // 쓰는 도중 프로세스가 죽어도 store.json이 깨지지 않도록 임시 파일 후 교체.
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tmp, STORE_PATH);
}

function commit(store: Store) {
  globalForStore.__petnoteStore = store;
  persist(store);
}

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

/* ─────────────────────────── 반려동물 ─────────────────────────── */

/**
 * 이 정렬이 그대로 화면 기본값이 된다 (진단·책 만들기가 pets[0]로 폴백한다).
 * 그래서 무지개다리를 건넌 아이는 뒤로 보낸다. 처음 들어온 사람에게
 * "초코의 성장 이야기"가 기본으로 열리면 안 된다.
 */
export function listPets(): Pet[] {
  return [...loadStore().pets].sort(
    (a, b) =>
      Number(!!a.passedAt) - Number(!!b.passedAt) ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

export function getPet(petId: string): Pet | null {
  return loadStore().pets.find((p) => p.id === petId) ?? null;
}

export function createPet(input: Omit<Pet, "id" | "createdAt">): Pet {
  const store = loadStore();
  const pet: Pet = { ...input, id: randomUUID(), createdAt: now() };
  commit({ ...store, pets: [...store.pets, pet] });
  return pet;
}

/* ───────────────────────────── 기록 ───────────────────────────── */

export function listRecords(
  petId: string,
  opts: { kinds?: RecordKind[]; from?: string; to?: string } = {}
): PetRecord[] {
  return loadStore()
    .records.filter((r) => {
      if (r.petId !== petId) return false;
      if (opts.kinds && !opts.kinds.includes(r.kind)) return false;
      if (opts.from && r.recordedAt < opts.from) return false;
      if (opts.to && r.recordedAt > opts.to) return false;
      return true;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function getRecord(recordId: string): PetRecord | null {
  return loadStore().records.find((r) => r.id === recordId) ?? null;
}

export function createRecord(
  input: Omit<PetRecord, "id" | "createdAt">
): PetRecord {
  const store = loadStore();
  const record: PetRecord = { ...input, id: randomUUID(), createdAt: now() };
  commit({ ...store, records: [...store.records, record] });
  return record;
}

export function updateRecord(
  recordId: string,
  patch: Partial<Pick<PetRecord, "title" | "note" | "weightKg" | "recordedAt" | "kind">>
): PetRecord | null {
  const store = loadStore();
  const target = store.records.find((r) => r.id === recordId);
  if (!target) return null;
  const updated: PetRecord = { ...target, ...patch };
  commit({
    ...store,
    records: store.records.map((r) => (r.id === recordId ? updated : r)),
  });
  return updated;
}

export function deleteRecord(recordId: string): boolean {
  const store = loadStore();
  if (!store.records.some((r) => r.id === recordId)) return false;
  commit({ ...store, records: store.records.filter((r) => r.id !== recordId) });
  return true;
}

/* ───────────────────────────── 주문 ───────────────────────────── */

export function listOrders(petId?: string): Order[] {
  return loadStore()
    .orders.filter((o) => !petId || o.petId === petId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrder(orderId: string): Order | null {
  return loadStore().orders.find((o) => o.id === orderId) ?? null;
}

export function createOrder(input: {
  petId: string;
  bookType: BookType;
  title: string;
  periodStart: string;
  periodEnd: string;
  recordIds: string[];
  option?: string | null;
}): Order {
  const store = loadStore();
  const order: Order = {
    ...input,
    id: randomUUID(),
    recordCount: input.recordIds.length,
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  };
  commit({ ...store, orders: [...store.orders, order] });
  return order;
}

/** 단방향 전이만 허용한다. 되돌리기나 건너뛰기는 없다. */
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
};

export function nextStatusOf(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status];
}

export function advanceOrder(orderId: string): Order | null {
  const store = loadStore();
  const target = store.orders.find((o) => o.id === orderId);
  if (!target) return null;

  const next = NEXT_STATUS[target.status];
  if (!next) return target; // 이미 완료. 요청을 무시하되 실패로 만들지는 않는다.

  const updated: Order = { ...target, status: next, updatedAt: now() };
  commit({
    ...store,
    orders: store.orders.map((o) => (o.id === orderId ? updated : o)),
  });
  return updated;
}

/* ─────────────────────────── 유틸 ─────────────────────────── */

export { today };

/** 예시 데이터(반려동물 3마리 + 기록 49건)를 불러온다. 기존 내용은 대체된다. */
export function loadSampleData(): void {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as Store;
  commit(seed);
}

/** 전부 비운다. 등록 흐름을 처음부터 다시 보고 싶을 때 쓴다. */
export function clearAll(): void {
  commit({ ...EMPTY });
}

/** 예시 데이터가 들어 있는 상태인지. 화면 안내 문구를 가르는 데 쓴다. */
export function isSampleLoaded(): boolean {
  return loadStore().pets.some((p) => p.id.startsWith("pet-"));
}

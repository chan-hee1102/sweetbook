# alpine 대신 slim(Debian)을 쓴다. alpine의 musl libc에서 next swc 바이너리가
# 환경에 따라 실패하는 일이 있어, 심사 환경에서의 재현성을 우선했다.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# 지식 데이터(358건)는 이미지에 포함한다. 외부 호출 없이 검색이 동작해야 하기 때문.
COPY --from=builder /app/seed ./seed

# 주문·기록이 저장되는 경로. compose에서 볼륨으로 마운트한다.
RUN mkdir -p /app/data
ENV DATA_DIR=/app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

ARG NODE_ENV=production

FROM base AS build
RUN pnpm install --prod
RUN pnpm build

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM gcr.io/distroless/nodejs20-debian12

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

WORKDIR /app

# Distroless are built by default to run "node" as the entrypoint
# so we don't need to specify it here
CMD [ "build/index.js"]

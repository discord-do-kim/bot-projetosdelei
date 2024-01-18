-> Deploy local:
```bash
pnpm i
pnpm build
pnpm start
```

Via docker:
```bash
docker build -t prj-de-leis
docker run --env-file .env prj-de-leis
```

Lembrando que só pode ter uma sessão por vez no server principal. :)
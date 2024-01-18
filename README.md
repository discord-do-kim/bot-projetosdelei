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

Lembrando que só pode ter uma sessão por vez no server do Kim. :)

### TODO

[ ] - Lint pelo prettier/eslint parece bem quebrado. Não consegui rodar bem no vscode. Coloquei o [Biome](https://github.com/biomejs/biome). Basicamente um super linter/formatter baseado no rust. Tem extensão pro VS Code e Vim. Meu VS Code tá todo esquisito, deve ter várias coisas conflitando aqui por isso que o ESlint não funfou legal.

# Sistema de Agendamentos — Configuração Claude

## IDENTIDADE
Você é um assistente desenvolvendo um sistema de agendamentos semanal.
Stack: Next.js, TypeScript, Prisma, Supabase, Tailwind CSS.
Deploy: Vercel automático via git push origin main.

## REGRAS DE MEMÓRIA

### Início de sessão (OBRIGATÓRIO)
Leia memory/wake-up.md como PRIMEIRA ação antes de qualquer coisa.

### Durante a sessão (OBRIGATÓRIO)
- Decisão de arquitetura → memory/decisions/YYYY-MM-DD.md
- Bug corrigido → memory/journal/HOJE.md
- Mudança de abordagem → atualize memory/wake-up.md

### Fim de sessão (OBRIGATÓRIO)
1. Atualize memory/journal/YYYY-MM-DD.md com resumo do que foi feito
2. Reescreva memory/wake-up.md com estado atual

## REGRAS DO PROJETO
- SEMPRE usar 100dvh (nunca 100vh) para altura no iOS Safari
- Header SEMPRE com flex-shrink-0 (nunca sticky dentro de overflow hidden)
- Prisma: usar db push (nunca migrate dev — ambiente não interativo)
- Após qualquer alteração: npx next build para verificar erros
- Deploy: git add + git commit + git push origin main
- NUNCA reativar Campanhas na navegação sem autorização

## ROUTING TABLE
| Quando pedir...     | Fazer primeiro                         |
|---------------------|----------------------------------------|
| Nova funcionalidade | Ler arquivos afetados antes de escrever |
| Bug mobile          | Verificar iOS Safari especificamente   |
| Deploy              | Rodar next build antes do push         |
| Mudança no banco    | Usar prisma db push                    

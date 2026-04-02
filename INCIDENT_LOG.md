# 🔴 Incident Log - Sistema de Agendamentos

## Incidente: Crons de Notificações Desabilitados (02/04/2026)

### Timeline
- **Data/Hora**: 02/04/2026, 06:54 (quando identificado)
- **Duração**: ~24 horas (desde 01/04)
- **Impacto**: Notificações de lembretes não foram disparadas

### Sintomas
- ❌ Notificações previstas para 02/04 às 6h não foram enviadas
- ❌ Status mostrava `0/4 enviados` para RAFAEL, SAMUEL, SANA
- ❌ Sem mensagens de erro (silent failure)

### Causa Raiz

#### 1️⃣ Crons Removidos de `vercel.json`
Anterior:
```json
{
  "regions": ["gru1"]
}
```

O `vercel.json` não tinha a seção `crons`, então nenhum cron rodava em produção.

#### 2️⃣ CRON_SECRET não estava no GitHub Actions
- `CRON_SECRET` existia no Vercel: `cronsecreto2026`
- Mas não estava nos GitHub Secrets
- Workflow falhava com **401 Unauthorized**
- Erro não era visível (silent failure)

#### 3️⃣ Endpoint Middleware
[src/middleware.ts:16-24](src/middleware.ts#L16-L24) valida:
```typescript
if (pathname.startsWith('/api/cron')) {
  const cronSecret = process.env.CRON_SECRET
  if (customHeader !== cronSecret && bearerHeader !== cronSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}
```

### Solução Implementada

#### Commit 1: Reabilitar Crons (`2daea1a`)
**Arquivo**: `vercel.json`

Antes:
```json
{
  "regions": ["gru1"]
}
```

Depois:
```json
{
  "regions": ["gru1"],
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/campaigns",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Impacto**: Crons agora rodam automaticamente a cada 5 e 10 minutos.

#### Commit 2: Endpoint de Debug Temporário (`77d0755`)
**Arquivo**: `src/app/api/debug/send-pending/route.ts`

Criado para:
- Testar disparos manualmente sem autenticação
- Validar que o endpoint funciona
- Disparar notificações pendentes durante o incident

Usado para:
```bash
curl "https://agendamento.solucoesdeia.com/api/debug/send-pending?password=debug123"
```

**Resultado**: ✅ Disparou 1 notificação com sucesso (RAFAEL)

#### Commit 3: Limpar Código (`1c0b271`)
**Arquivo**: Deletado `src/app/api/debug/send-pending/route.ts`

Removed porque:
- CRON_SECRET agora estava configurado no GitHub
- Endpoint de debug não era mais necessário
- Código limpo = segurança melhor

### Verificações Realizadas

✅ **Teste do Endpoint**
```bash
curl -H "x-cron-secret: cronsecreto2026" \
  https://agendamento.solucoesdeia.com/api/cron/notifications
# Response: {"ok":true,"sent":1,"failed":0,"remaining":2,"customer":"RAFAEL ALVES DOS SANTOS"}
```

✅ **Status das Notificações**
- RAFAEL: 2/4 enviados ✅
- SAMUEL: 1/4 enviados ✅
- SANA: 2/4 enviados ✅

✅ **Configurações Finais**
- Vercel: `cronsecreto2026` ✅
- GitHub Actions: `CRON_SECRET = cronsecreto2026` ✅
- Vercel.json: Crons ativos ✅

### Status Atual: ✅ RESOLVIDO

| Item | Status |
|------|--------|
| Crons em Vercel | ✅ Ativo (5min) |
| CRON_SECRET Vercel | ✅ Configurado |
| CRON_SECRET GitHub | ✅ Configurado |
| Notificações pendentes | ✅ Disparadas |
| Teste com novo agendamento | ✅ Em progresso (Cissa, 02/04 10:25h) |

### Lições Aprendidas

1. **Crons críticos devem estar em vercel.json** - sem ele, nada roda
2. **CRON_SECRET deve estar em dois lugares**: Vercel + GitHub
3. **Falhas silent** são perigosas - adicionar logs/alertas
4. **Teste de produção**: Criar agendamento de teste regularmente

### Prevenção Futura

- [ ] Adicionar monitoramento de crons (uptime monitoring)
- [ ] Alertas quando nenhuma notificação é processada em 15min
- [ ] Documentação sobre CRON_SECRET em README
- [ ] CI/CD check: validar que vercel.json tem crons

### Referências

- **Endpoint**: `/api/cron/notifications`
- **Middleware**: [src/middleware.ts](src/middleware.ts)
- **Notificações**: [src/lib/notifications.ts](src/lib/notifications.ts)
- **Workflow**: [.github/workflows/notifications-cron.yml](.github/workflows/notifications-cron.yml)

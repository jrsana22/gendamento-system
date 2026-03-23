-- ============================================================
-- HIGOR RECRUTAMENTO — Estrutura Supabase
-- Execute no SQL Editor do Supabase (supabase.com → SQL Editor)
-- ============================================================


-- ── 1. LEADS ──────────────────────────────────────────────────
-- Cada lead que entra no fluxo de recrutamento via WhatsApp

CREATE TABLE IF NOT EXISTS higor_recrutamento_leads (
  id                     bigserial PRIMARY KEY,
  remotejid              text UNIQUE NOT NULL,   -- ID WA: 5531XXXXXXX@s.whatsapp.net
  nome_associado         text,                   -- nome bruto do webhook (senderName)
  nome_completo          text,                   -- coletado pelo agente (MAIÚSCULAS sem acento)
  rg                     text,                   -- RG coletado na fase 4
  data_nascimento        text,                   -- data de nascimento fase 4
  origem                 text,                   -- instância (owner da UAZAPI)
  atendimento_finalizado boolean DEFAULT false,  -- true = bot pausado pra esse contato
  agendamento_criado     boolean DEFAULT false,  -- true = webhook do sistema chamado OK
  timestamp              timestamptz DEFAULT now(),
  created_at             timestamptz DEFAULT now()
);

-- RLS: desabilitar para que o n8n acesse sem restrição de auth
ALTER TABLE higor_recrutamento_leads DISABLE ROW LEVEL SECURITY;


-- ── 2. HISTÓRICO DE MENSAGENS ──────────────────────────────────
-- Armazena cada turno de conversa no formato Gemini {role, parts}
-- Usado para montar o "contents" a cada nova chamada ao modelo

CREATE TABLE IF NOT EXISTS higor_recrutamento_mensagens (
  id                   bigserial PRIMARY KEY,
  remotejid            text NOT NULL,
  conversation_history jsonb NOT NULL,  -- { role: "user"|"model"|"function", parts: [...] }
  timestamp            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_higor_msg_remotejid
  ON higor_recrutamento_mensagens(remotejid);

CREATE INDEX IF NOT EXISTS idx_higor_msg_order
  ON higor_recrutamento_mensagens(remotejid, id ASC);

ALTER TABLE higor_recrutamento_mensagens DISABLE ROW LEVEL SECURITY;


-- ── 3. LISTA DE TOOLS (Function Declarations Gemini) ──────────
-- Cada linha é uma function declaration.
-- O agente Higor usa: type = 'higor_recrutamento'

CREATE TABLE IF NOT EXISTS lista_tools (
  id   bigserial PRIMARY KEY,
  type text NOT NULL,   -- identificador do agente
  tool jsonb NOT NULL   -- objeto no formato Gemini functionDeclaration
);

CREATE INDEX IF NOT EXISTS idx_lista_tools_type ON lista_tools(type);

ALTER TABLE lista_tools DISABLE ROW LEVEL SECURITY;


-- ── 4. CONFIG GLOBAL ──────────────────────────────────────────
-- Tabela singleton (sempre 1 linha, id = 1)

CREATE TABLE IF NOT EXISTS apvs_config (
  id             int PRIMARY KEY DEFAULT 1,
  prompt_noturno boolean DEFAULT false,
  updated_at     timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO apvs_config (id, prompt_noturno)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE apvs_config DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- INSERIR AS 4 FUNCTIONS DO AGENTE HIGOR
-- (Gemini usa "OBJECT" e "STRING" em maiúsculas no schema)
-- ============================================================

INSERT INTO lista_tools (type, tool) VALUES

-- FUNCTION 1: lead entra no fluxo (fase 1 — primeira mensagem)
('higor_recrutamento', '{
  "name": "lead_entrou_no_fluxo_piedade",
  "description": "Registra a entrada do lead no fluxo de recrutamento da APVS Piedade. Disparar na PRIMEIRA mensagem recebida, independente do conteúdo. O remotejid é coletado silenciosamente do contexto.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "remotejid": {
        "type": "STRING",
        "description": "ID remoto do contato (ex: 553186058233@s.whatsapp.net). Coletar do contexto da conversa sem perguntar ao lead."
      }
    },
    "required": ["remotejid"]
  }
}'),

-- FUNCTION 2: lead demonstrou interesse após assistir o vídeo (fase 3)
('higor_recrutamento', '{
  "name": "lead_demonstrou_interesse_higor",
  "description": "Registra que o lead assistiu ao vídeo e confirmou interesse em participar do processo seletivo. Disparar SOMENTE após confirmação positiva pós-vídeo.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "remotejid": {
        "type": "STRING",
        "description": "ID remoto do contato. Coletar do contexto sem perguntar ao lead."
      }
    },
    "required": ["remotejid"]
  }
}'),

-- FUNCTION 3: salva os dados do agendamento (fase 4 — após coletar nome, RG, nascimento)
('higor_recrutamento', '{
  "name": "higor_agendamento",
  "description": "Registra o lead confirmado no processo seletivo com os dados coletados. Executar IMEDIATAMENTE após receber nome completo, RG e data de nascimento.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "remotejid": {
        "type": "STRING",
        "description": "ID remoto do contato. Coletar do contexto sem perguntar ao lead."
      },
      "nome_completo": {
        "type": "STRING",
        "description": "Nome completo do lead em MAIÚSCULAS sem acentos."
      },
      "rg": {
        "type": "STRING",
        "description": "RG do lead conforme informado."
      },
      "data_nascimento": {
        "type": "STRING",
        "description": "Data de nascimento do lead conforme informada."
      }
    },
    "required": ["remotejid", "nome_completo", "rg", "data_nascimento"]
  }
}'),

-- FUNCTION 4: cria o agendamento no sistema externo (gera os 4 lembretes automáticos)
('higor_recrutamento', '{
  "name": "agendar_lembrete",
  "description": "Agenda o disparo automático dos lembretes para o lead confirmado. O sistema enviará lembretes via WhatsApp 24h, 3h, 1h e 15min antes do processo seletivo. Executar logo após higor_agendamento.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "remotejid": {
        "type": "STRING",
        "description": "ID remoto do contato. Coletar do contexto sem perguntar ao lead."
      },
      "nome_completo": {
        "type": "STRING",
        "description": "Nome completo do lead para personalizar os lembretes."
      }
    },
    "required": ["remotejid", "nome_completo"]
  }
}');


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'higor_recrutamento_leads'  AS tabela, count(*) AS registros FROM higor_recrutamento_leads
UNION ALL
SELECT 'higor_recrutamento_mensagens', count(*) FROM higor_recrutamento_mensagens
UNION ALL
SELECT 'lista_tools (higor)', count(*) FROM lista_tools WHERE type = 'higor_recrutamento'
UNION ALL
SELECT 'apvs_config', count(*) FROM apvs_config;

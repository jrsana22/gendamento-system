import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

/**
 * POST /api/admin/clients/quick-create
 *
 * Endpoint para admin criar novos clientes (usuários + credenciais de acesso)
 * em uma única requisição.
 *
 * Body esperado:
 * {
 *   "name": "Nome do Cliente",
 *   "email": "cliente@example.com",
 *   "password": "senha123",
 *   "instanceName": "instance_name",
 *   "evoUrl": "https://evolution.example.com",
 *   "apiKey": "sk-xxx",
 *   "phone": "5531999999999" (opcional),
 *   "agentWebhook": "https://n8n.example.com/webhook" (opcional)
 * }
 *
 * Resposta (sucesso):
 * {
 *   "ok": true,
 *   "email": "cliente@example.com",
 *   "password": "senha123",
 *   "webhookToken": "cuid-xxx",
 *   "clientName": "Nome do Cliente"
 * }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    name?: string
    email?: string
    password?: string
    instanceName?: string
    evoUrl?: string
    apiKey?: string
    phone?: string
    agentWebhook?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, email, password, instanceName, evoUrl, apiKey, phone, agentWebhook } = body

  // Validate required fields
  if (!name || !email || !password || !instanceName || !evoUrl || !apiKey) {
    return NextResponse.json(
      {
        error: 'Missing required fields: name, email, password, instanceName, evoUrl, apiKey',
      },
      { status: 400 }
    )
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Email já cadastrado no sistema' },
      { status: 409 }
    )
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10)

  // Create User + Client atomically
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: 'CLIENT',
      client: {
        create: {
          name,
          instanceName,
          evoUrl,
          apiKey,
          phone: phone || null,
          agentWebhook: agentWebhook || null,
        },
      },
    },
    include: { client: true },
  })

  return NextResponse.json({
    ok: true,
    email: user.email,
    password, // Plaintext returned once (admin's responsibility to securely transmit)
    webhookToken: user.client?.webhookToken,
    clientName: user.client?.name,
  })
}

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@solucoesdeia.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const hashed = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashed,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin criado:', admin.email)
  if (adminPassword === 'admin123') {
    console.log('⚠️  Senha padrão detectada! Defina ADMIN_PASSWORD no .env antes de subir para produção.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

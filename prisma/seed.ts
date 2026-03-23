import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const rawUrl = process.env.DATABASE_URL || 'file:./dev.db'
const dbUrl = (() => {
  if (rawUrl.startsWith('file:./') || rawUrl.startsWith('file:../')) {
    const relativePath = rawUrl.replace(/^file:/, '')
    const absolutePath = path.resolve(process.cwd(), relativePath)
    return `file://${absolutePath}`
  }
  return rawUrl
})()

const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...\n')

  const existing = await prisma.location.findUnique({ where: { slug: 'demo' } })
  if (!existing) {
    await prisma.location.create({
      data: {
        name: 'Demo Store',
        slug: 'demo',
        address: '123 Main Street',
      },
    })
    console.log('✅ Demo location created')
  } else {
    console.log('✅ Demo location already exists')
  }

  console.log('✅ Database ready\n')
  console.log('─────────────────────────────────────')
  console.log('Next steps:')
  console.log('1. Visit http://localhost:3000/admin')
  console.log('2. Log in with your ADMIN_PASSWORD')
  console.log('3. Add your store locations under Locations')
  console.log('4. Create a Hunt for each location')
  console.log('5. Add Clues to each Hunt in the Clue Builder')
  console.log('6. Generate QR codes under each Hunt → QR Code')
  console.log('7. Print and place posters at store entrances')
  console.log('─────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

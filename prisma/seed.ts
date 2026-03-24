import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'
import bcrypt from 'bcryptjs'

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

  // Default admin user
  const existing = await prisma.adminUser.findUnique({ where: { username: 'admin' } })
  if (!existing) {
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
    })
    console.log('✅ Default admin user created (admin / admin123)')
  } else {
    console.log('✅ Admin user already exists')
  }

  // Demo location
  const existingLocation = await prisma.location.findUnique({ where: { slug: 'demo' } })
  if (!existingLocation) {
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

  console.log('\n✅ Database ready\n')
  console.log('─────────────────────────────────────')
  console.log('Next steps:')
  console.log('1. Visit http://localhost:3000/admin')
  console.log('2. Log in with: admin / admin123')
  console.log('3. Change the admin password in Users → Edit')
  console.log('4. Add your store locations under Locations')
  console.log('5. Create a Hunt for each location')
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

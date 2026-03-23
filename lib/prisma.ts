import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function resolveDbUrl(): string {
  const rawUrl = process.env.DATABASE_URL || 'file:./dev.db'
  if (rawUrl.startsWith('file:./') || rawUrl.startsWith('file:../')) {
    const relativePath = rawUrl.replace(/^file:/, '')
    const absolutePath = path.resolve(process.cwd(), relativePath)
    return `file://${absolutePath}`
  }
  return rawUrl
}

function createPrismaClient(): PrismaClient {
  const url = resolveDbUrl()
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { prisma } from './prisma'

export async function generateVoucherCode(
  voucherPrefix: string,
  locationSlug: string
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const prefix = voucherPrefix.toUpperCase()
  const slug = locationSlug.toUpperCase()

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${prefix}-${slug}-${nanoid(6).toUpperCase()}`
    const existing = await prisma.participant.findUnique({
      where: { voucherCode: code },
    })
    if (!existing) return code
  }

  // Fallback with timestamp
  const timestamp = Date.now().toString(36).toUpperCase()
  return `${prefix}-${slug}-${timestamp}`
}

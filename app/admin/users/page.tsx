import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UsersClient } from './users-client'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/admin')

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">Manage admin accounts and their access levels.</p>
      </div>
      <UsersClient users={users} currentUserId={session.userId} />
    </div>
  )
}

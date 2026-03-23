import { getSession } from '@/lib/auth'
import { SidebarNav } from '@/components/admin/sidebar-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAuth = await getSession()

  // Login page — render without chrome (middleware handles redirects)
  if (!isAuth) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed left sidebar */}
      <SidebarNav />

      {/* Main content — offset for sidebar */}
      <div className="flex-1 flex flex-col min-h-screen pl-60">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

import { requireAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: '#FDFAF5' }}>
        {children}
      </main>
    </div>
  )
}

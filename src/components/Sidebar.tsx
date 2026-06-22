'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: '◈' },
  { href: '/books',     label: 'Books',      icon: '⊟' },
  { href: '/inventory', label: 'Inventory',  icon: '⊞' },
  { href: '/invoices',  label: 'Invoices',   icon: '⊠' },
  { href: '/contacts',  label: 'Contacts',   icon: '⊙' },
  { href: '/settings',  label: 'Settings',   icon: '⊚' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r" style={{ background: '#1B7B5E', borderColor: '#156650' }}>
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: '#156650' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: '#F47920', color: '#fff' }}>
            OJ
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: '#fff' }}>OJ Sippin</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Business</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#156650' }}>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <span>↪</span> Sign out
        </button>
      </div>
    </aside>
  )
}

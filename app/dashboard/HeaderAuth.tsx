'use client'

import { createClient } from '@/lib/supabase/client'

export default function HeaderAuth({
  email,
  avatar,
}: {
  email?: string | null
  avatar?: string | null
}) {
  async function openLoginPopup() {
    const supabase = createClient()
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback/login`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        skipBrowserRedirect: true,
      },
    })
    if (data?.url) {
      window.open(data.url, '_blank', 'width=560,height=660,popup=yes,left=200,top=100')
    }
  }

  if (email) {
    return (
      <div className="flex items-center gap-3">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={email} className="h-7 w-7 rounded-full" />
        )}
        <span className="text-sm text-drrop-subtle">{email}</span>
        <form action="/auth/signout" method="POST">
          <button className="text-sm text-drrop-muted hover:text-drrop-text transition">
            Sign out
          </button>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={openLoginPopup}
      className="text-sm text-drrop-muted hover:text-drrop-text transition"
    >
      Sign in
    </button>
  )
}

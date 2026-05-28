'use client'

export default function HeaderAuth({
  email,
  avatar,
}: {
  email?: string | null
  avatar?: string | null
}) {
  function openLoginPopup() {
    window.open(
      '/auth/callback/initiate?service=login',
      '_blank',
      'width=560,height=660,popup=yes,left=200,top=100'
    )
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
      className="rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      style={{ backgroundColor: '#4285F4' }}
    >
      Sign in
    </button>
  )
}

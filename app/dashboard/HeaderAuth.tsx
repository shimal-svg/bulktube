export default function HeaderAuth({
  email,
  avatar,
}: {
  email?: string | null
  avatar?: string | null
}) {
  if (!email) return null

  return (
    <div className="flex items-center gap-2">
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={email} className="h-7 w-7 rounded-full" />
      )}
      <span className="text-sm text-drrop-subtle">{email}</span>
    </div>
  )
}

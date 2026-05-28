import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

type PendingCookie = { name: string; value: string; options: Record<string, unknown> }

export function createCallbackClient(request: Request, pendingCookies: PendingCookie[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (
            request.headers
              .get("cookie")
              ?.split(";")
              .map((c) => {
                const [name, ...rest] = c.trim().split("=")
                return { name: name.trim(), value: rest.join("=").trim() }
              }) ?? []
          )
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push({ name, value, options: options ?? {} })
          )
        },
      },
    }
  )
}

export function popupResponse(
  payload: Record<string, unknown>,
  pendingCookies: PendingCookie[]
) {
  const safe = JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
try{if(window.opener)window.opener.postMessage(${safe},window.location.origin);}catch(e){}
setTimeout(function(){window.close();},100);
</script></body></html>`

  const res = new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  )
  return res
}

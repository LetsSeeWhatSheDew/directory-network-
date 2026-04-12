import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const INTENTS = ['best', 'open-now', 'recreational', 'deals']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const match = pathname.match(/^\/cannabis\/illinois\/([^/]+)\/([^/]+)$/)
  if (match) {
    const intent = match[2]
    if (INTENTS.includes(intent)) {
      return NextResponse.next()
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/cannabis/illinois/:city/:intent'
}

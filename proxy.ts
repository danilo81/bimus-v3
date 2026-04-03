import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
        // Redirigir a la página principal si no hay sesión
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/projects/:path*',
        '/dashboard/:path*',
        '/accounting/:path*',
        '/admin/:path*',
        '/community/:path*',
        '/workspace/:path*',
        '/library/:path*',
    ],
}

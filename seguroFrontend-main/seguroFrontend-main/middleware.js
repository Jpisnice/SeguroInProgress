import { NextResponse } from 'next/server'

export function middleware(request) {
    const userType = request.cookies.get('userType')?.value;

    const vendorRoutes = ['/codes', '/customers', '/properties', '/reports', '/rooms', '/settings'];

    // Check if the request is for the initial route '/'
    if (request.nextUrl.pathname === '/') {
        if (userType === "A") {
            return NextResponse.redirect(new URL('/adminDashboard', request.url))
        } else if (userType === "V") {
            return NextResponse.redirect(new URL('/codes', request.url))
        }
    }

    if (request.nextUrl.pathname.startsWith('/admin') && userType !== 'A') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if the request is for one of the vendor routes
    if (vendorRoutes.some(route => request.nextUrl.pathname == route) && userType !== 'V') {
        return NextResponse.redirect(new URL('/', request.url));
    }

}
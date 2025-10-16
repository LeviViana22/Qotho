import { NextResponse } from 'next/server'

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    console.log('Test callback - Code:', code)
    console.log('Test callback - Error:', error)
    console.log('Test callback - Full URL:', request.url)
    
    return NextResponse.json({
        code: code,
        error: error,
        url: request.url,
        searchParams: Object.fromEntries(searchParams.entries())
    })
}

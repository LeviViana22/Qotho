import {
    authRoutes as _authRoutes,
    publicRoutes as _publicRoutes,
} from '@/configs/routes.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'

const publicRoutes = Object.entries(_publicRoutes).map(([key]) => key)
const authRoutes = Object.entries(_authRoutes).map(([key]) => key)

const apiAuthPrefix = `${appConfig.apiPrefix}/auth`

export default function middleware(req) {
    const { nextUrl } = req

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    /** Skip auth middleware for all api routes */
    if (isApiRoute) return

    /** Skip auth middleware for public routes */
    if (isPublicRoute) return

    /** Skip auth middleware for auth routes */
    if (isAuthRoute) return

    /** For all other routes, let NextAuth handle authentication */
    return
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)'],
    runtime: 'nodejs', // Force middleware to run in Node.js runtime instead of Edge Runtime
}

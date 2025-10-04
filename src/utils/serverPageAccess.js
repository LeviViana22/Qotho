import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasPageAccess } from '@/utils/pageAccess'

/**
 * Server-side page access check
 * Use this in page components to protect routes
 * @param {string} requiredPage - The page path that requires access
 * @param {string} fallbackPath - Where to redirect if no access (default: '/access-denied')
 */
export async function checkPageAccess(requiredPage, fallbackPath = '/access-denied') {
    const session = await auth()
    
    if (!session) {
        redirect('/sign-in')
    }

    if (!hasPageAccess(session.user.role, requiredPage)) {
        redirect(fallbackPath)
    }

    return session
}

/**
 * Check if user has admin access
 * @param {string} fallbackPath - Where to redirect if not admin (default: '/access-denied')
 */
export async function requireAdmin(fallbackPath = '/access-denied') {
    const session = await auth()
    
    if (!session) {
        redirect('/sign-in')
    }

    // HARDCODED BYPASS - ALWAYS ALLOW ADMIN ACCESS
    if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
        redirect(fallbackPath)
    }

    return session
}

/**
 * Check if user has supervisor or higher access
 * @param {string} fallbackPath - Where to redirect if insufficient access (default: '/access-denied')
 */
export async function requireSupervisorOrHigher(fallbackPath = '/access-denied') {
    const session = await auth()
    
    if (!session) {
        redirect('/sign-in')
    }

    // HARDCODED BYPASS - ALWAYS ALLOW ADMIN ACCESS
    const supervisorRoles = ['admin', 'ADMIN', 'supervisor', 'SUPERVISOR']
    if (!supervisorRoles.includes(session.user.role)) {
        redirect(fallbackPath)
    }

    return session
}

'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useRolePermissionsStore } from '@/app/(protected-pages)/concepts/account/roles-permissions/_store/rolePermissionsStore'

/**
 * Client-side access control component
 * Checks localStorage modifications and redirects if user doesn't have access
 */
const ClientAccessControl = ({ 
    requiredModule = 'users', 
    fallbackPath = '/access-denied',
    children 
}) => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const roleList = useRolePermissionsStore((state) => state.roleList)

    useEffect(() => {
        if (status === 'loading') return

        if (!session?.user) {
            router.push('/sign-in')
            return
        }

        // Admin always has access
        if (session.user.role === 'admin' || session.user.role === 'ADMIN') {
            return
        }

        // Check if user has permission for the required module
        let role = roleList.find(r => r.id === session.user.role)
        if (!role || !role.accessRight) {
            router.push(fallbackPath)
            return
        }

        // Check for role modifications in localStorage
        if (typeof window !== 'undefined') {
            const roleModifications = JSON.parse(localStorage.getItem('roleModifications') || '{}')
            if (roleModifications[session.user.role]) {
                role = roleModifications[session.user.role]
            }
        }

        // Check if the role has edit permission for the module
        const modulePermissions = role.accessRight[requiredModule]
        if (!modulePermissions || !modulePermissions.includes('edit')) {
            router.push(fallbackPath)
            return
        }
    }, [session, status, roleList, requiredModule, fallbackPath, router])

    // Show loading while checking permissions
    if (status === 'loading') {
        return <div>Loading...</div>
    }

    // Don't render children if user doesn't have access
    if (!session?.user) {
        return null
    }

    // Admin always has access
    if (session.user.role === 'admin' || session.user.role === 'ADMIN') {
        return <>{children}</>
    }

    // Check permissions for non-admin users
    let role = roleList.find(r => r.id === session.user.role)
    if (!role || !role.accessRight) {
        return null
    }

    // Check for role modifications in localStorage
    if (typeof window !== 'undefined') {
        const roleModifications = JSON.parse(localStorage.getItem('roleModifications') || '{}')
        if (roleModifications[session.user.role]) {
            role = roleModifications[session.user.role]
        }
    }

    const modulePermissions = role.accessRight[requiredModule]
    if (!modulePermissions || !modulePermissions.includes('edit')) {
        return null
    }

    return <>{children}</>
}

export default ClientAccessControl

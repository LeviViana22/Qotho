'use client'

import { useState, useEffect } from 'react'
import Switcher from '@/components/ui/Switcher'
import { useSession } from 'next-auth/react'
import { useRolePermissionsStore } from '@/app/(protected-pages)/concepts/account/roles-permissions/_store/rolePermissionsStore'

/**
 * Simple permission switcher component
 * Shows a switcher that controls whether the user has edit access to user management pages
 * @param {Object} props
 * @param {string} props.module - The module to check permissions for (e.g., 'users')
 * @param {string} props.label - Label for the switcher
 * @param {Function} props.onPermissionChange - Callback when permission changes
 */
const PermissionSwitcher = ({ 
    module = 'users', 
    label = 'Permissão de edição', 
    onPermissionChange 
}) => {
    const { data: session } = useSession()
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const [hasEditPermission, setHasEditPermission] = useState(false)

    useEffect(() => {
        if (!session?.user?.role || !roleList.length) return

        // Admin always has full access
        if (session.user.role === 'admin' || session.user.role === 'ADMIN') {
            setHasEditPermission(true)
            return
        }

        // Find the user's role in the role list
        let role = roleList.find(r => r.id === session.user.role)
        if (!role || !role.accessRight) {
            setHasEditPermission(false)
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
        const modulePermissions = role.accessRight[module]
        if (!modulePermissions) {
            setHasEditPermission(false)
            return
        }

        // Check if the user has edit permission
        const canEdit = modulePermissions.includes('edit')
        setHasEditPermission(canEdit)
    }, [session?.user?.role, roleList, module])

    const handlePermissionChange = (value) => {
        setHasEditPermission(value)
        onPermissionChange?.(value)
    }

    // Don't show the switcher for admin users since they always have access
    if (session?.user?.role === 'admin' || session?.user?.role === 'ADMIN') {
        return null
    }

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}:
            </span>
            <Switcher
                checked={hasEditPermission}
                onChange={handlePermissionChange}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {hasEditPermission ? 'Editar' : 'Apenas visualizar'}
            </span>
        </div>
    )
}

export default PermissionSwitcher

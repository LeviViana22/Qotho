/**
 * Utility to check role permissions including localStorage modifications
 * This can be used both client-side and server-side (with some limitations)
 */

/**
 * Get role permissions including localStorage modifications
 * @param {string} roleId - The role ID to check
 * @param {Array} roleList - The base role list from server
 * @param {boolean} isClient - Whether this is running on client-side
 * @returns {Object|null} - The role object with permissions
 */
export function getRoleWithPermissions(roleId, roleList, isClient = false) {
    // Find the base role
    let role = roleList.find(r => r.id === roleId)
    if (!role) {
        return null
    }

    // If on client-side, check localStorage modifications
    if (isClient && typeof window !== 'undefined') {
        const roleModifications = JSON.parse(localStorage.getItem('roleModifications') || '{}')
        if (roleModifications[roleId]) {
            role = roleModifications[roleId]
        }
    }

    return role
}

/**
 * Check if a role has permission for a specific module
 * @param {string} roleId - The role ID to check
 * @param {string} module - The module to check permissions for
 * @param {Array} roleList - The base role list from server
 * @param {boolean} isClient - Whether this is running on client-side
 * @returns {boolean} - Whether the role has permission
 */
export function hasModulePermission(roleId, module, roleList, isClient = false) {
    const role = getRoleWithPermissions(roleId, roleList, isClient)
    if (!role || !role.accessRight) {
        return false
    }

    const modulePermissions = role.accessRight[module]
    if (!modulePermissions) {
        return false
    }

    return modulePermissions.includes('edit')
}

/**
 * Check if a role has edit permission for user management
 * @param {string} roleId - The role ID to check
 * @param {Array} roleList - The base role list from server
 * @param {boolean} isClient - Whether this is running on client-side
 * @returns {boolean} - Whether the role has edit permission for users
 */
export function hasUserManagementPermission(roleId, roleList, isClient = false) {
    return hasModulePermission(roleId, 'users', roleList, isClient)
}

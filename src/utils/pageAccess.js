import { ROLE_PAGE_PERMISSIONS, ROLE_HIERARCHY } from '@/constants/roles.constant'

/**
 * Check if a user role has access to a specific page
 * @param {string} userRole - The user's role
 * @param {string} pagePath - The page path to check (e.g., 'dashboards', 'concepts/account/settings')
 * @returns {boolean} - Whether the user has access to the page
 */
export function hasPageAccess(userRole, pagePath) {
    // HARDCODED BYPASS - ADMIN ALWAYS HAS ACCESS
    if (userRole === 'ADMIN' || userRole === 'admin') {
        return true
    }

    if (!userRole || !pagePath) {
        return false
    }

    const rolePermissions = ROLE_PAGE_PERMISSIONS[userRole]
    
    if (!rolePermissions) {
        return false
    }

    // Admin has access to all pages
    if (rolePermissions.pages.includes('*')) {
        return true
    }

    // Check if the page path matches any allowed pages
    return rolePermissions.pages.some(allowedPage => {
        // Exact match
        if (allowedPage === pagePath) {
            return true
        }
        
        // Check if the page path starts with the allowed page (for sub-pages)
        if (pagePath.startsWith(allowedPage + '/')) {
            return true
        }
        
        return false
    })
}

/**
 * Get all pages accessible by a role
 * @param {string} userRole - The user's role
 * @returns {string[]} - Array of accessible page paths
 */
export function getAccessiblePages(userRole) {
    if (!userRole) {
        return []
    }

    const rolePermissions = ROLE_PAGE_PERMISSIONS[userRole]
    
    if (!rolePermissions) {
        return []
    }

    // Admin has access to all pages
    if (rolePermissions.pages.includes('*')) {
        return ['*'] // Return wildcard to indicate all pages
    }

    return rolePermissions.pages
}

/**
 * Check if a user role has higher or equal hierarchy level than required
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The minimum required role
 * @returns {boolean} - Whether the user has sufficient hierarchy level
 */
export function hasRoleHierarchy(userRole, requiredRole) {
    const userLevel = ROLE_HIERARCHY[userRole] || 0
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
    
    return userLevel >= requiredLevel
}

/**
 * Get role description
 * @param {string} userRole - The user's role
 * @returns {string} - Role description
 */
export function getRoleDescription(userRole) {
    const rolePermissions = ROLE_PAGE_PERMISSIONS[userRole]
    return rolePermissions?.description || 'Função não definida'
}

/**
 * Check if user can access admin-only features
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user is admin
 */
export function isAdmin(userRole) {
    return userRole === 'admin' || userRole === 'ADMIN'
}

/**
 * Check if user can access supervisor-level features
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user is supervisor or higher
 */
export function isSupervisorOrHigher(userRole) {
    return hasRoleHierarchy(userRole, 'supervisor')
}

/**
 * Check if user can access support-level features
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user is support or higher
 */
export function isSupportOrHigher(userRole) {
    return hasRoleHierarchy(userRole, 'support')
}

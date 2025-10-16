import ApiService from './ApiService'

export async function apiGetFiles(params) {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: '/files',
        method: 'get',
        params,
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiUploadFile(formData) {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: '/files/upload',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': authHeader
        },
    })
}

export async function apiDeleteFile(fileId) {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}`,
        method: 'delete',
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiRenameFile(fileId, newName) {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/rename`,
        method: 'patch',
        data: { name: newName },
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiCreateFolder(name, parentId = 'root') {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: '/files/folder',
        method: 'post',
        data: { name, parentId },
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiDownloadFile(fileId) {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/download`,
        method: 'get',
        responseType: 'blob',
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiShareFile(fileId, email, role = 'reader') {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/share`,
        method: 'post',
        data: { email, role },
        headers: {
            'Authorization': authHeader
        }
    })
}

export async function apiGetFolderSize(folderId) {
    if (typeof window === 'undefined') {
        throw new Error('FileService can only be used on the client side')
    }

    const { getAuthHeader } = await import('@/lib/googleDriveAuth')
    const authHeader = getAuthHeader()
    if (!authHeader) {
        throw new Error('No Google Drive access token available')
    }

    return ApiService.fetchDataWithAxios({
        url: `/files/${folderId}/size`,
        method: 'get',
        timeout: 300000, // 5 minutes for large folder calculations
        headers: {
            'Authorization': authHeader
        }
    })
}
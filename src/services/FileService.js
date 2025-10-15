import ApiService from './ApiService'

export async function apiGetFiles(params) {
    return ApiService.fetchDataWithAxios({
        url: '/files',
        method: 'get',
        params,
    })
}

export async function apiUploadFile(formData) {
    return ApiService.fetchDataWithAxios({
        url: '/files/upload',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiDeleteFile(fileId) {
    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}`,
        method: 'delete',
    })
}

export async function apiRenameFile(fileId, newName) {
    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/rename`,
        method: 'patch',
        data: { name: newName },
    })
}

export async function apiCreateFolder(name, parentId = 'root') {
    return ApiService.fetchDataWithAxios({
        url: '/files/folder',
        method: 'post',
        data: { name, parentId },
    })
}

export async function apiDownloadFile(fileId) {
    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/download`,
        method: 'get',
        responseType: 'blob',
    })
}

export async function apiShareFile(fileId, email, role = 'reader') {
    return ApiService.fetchDataWithAxios({
        url: `/files/${fileId}/share`,
        method: 'post',
        data: { email, role },
    })
}
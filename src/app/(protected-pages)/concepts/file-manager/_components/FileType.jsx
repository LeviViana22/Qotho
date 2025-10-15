const getFileType = (type) => {
    switch (type) {
        case 'pdf':
            return 'PDF'
        case 'xls':
            return 'XLS'
        case 'doc':
            return 'DOC'
        case 'ppt':
            return 'PPT'
        case 'figma':
            return 'Figma'
        case 'jpeg':
        case 'image/jpeg':
            return 'JPEG'
        case 'png':
        case 'image/png':
            return 'PNG'
        case 'gif':
        case 'image/gif':
            return 'GIF'
        case 'webp':
        case 'image/webp':
            return 'WEBP'
        case 'directory':
            return 'Folder'
        case 'unknown':
            return 'File'
        default:
            return type.toUpperCase() || 'File'
    }
}

const FileType = ({ type }) => {
    return <>{getFileType(type)}</>
}

export default FileType

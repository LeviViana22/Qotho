'use client'

import FileDoc from '@/assets/svg/files/FileDoc'
import FileXls from '@/assets/svg/files/FileXls'
import FilePdf from '@/assets/svg/files/FilePdf'
import FilePpt from '@/assets/svg/files/FilePpt'
import FileFigma from '@/assets/svg/files/FileFigma'
import FileImage from '@/assets/svg/files/FileImage'
import Folder from '@/assets/svg/files/Folder'

const FileIcon = ({ type, size = 40 }) => {
    switch (type) {
        case 'pdf':
            return <FilePdf height={size} width={size} />
        case 'xls':
        case 'xlsx':
            return <FileXls height={size} width={size} />
        case 'doc':
        case 'docx':
            return <FileDoc height={size} width={size} />
        case 'ppt':
        case 'pptx':
            return <FilePpt height={size} width={size} />
        case 'figma':
            return <FileFigma height={size} width={size} />
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'svg':
            return <FileImage height={size} width={size} />
        case 'txt':
        case 'text':
            return <FileDoc height={size} width={size} />
        case 'mp3':
        case 'wav':
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
            return <FilePpt height={size} width={size} />
        case 'zip':
        case 'rar':
        case '7z':
            return <Folder height={size} width={size} />
        case 'directory':
            return <Folder height={size} width={size} />
        default:
            return <FileDoc height={size} width={size} />
    }
}

export default FileIcon

'use client'
import { useMemo, useState, useEffect } from 'react'
import Drawer from '@/components/ui/Drawer'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import FileIcon from '@/components/view/FileIcon'
import FileType from './FileType'
import fileSizeUnit from '@/utils/fileSizeUnit'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import dayjs from 'dayjs'
import { TbPlus } from 'react-icons/tb'
import { truncateFileName } from '@/utils/textTruncate'

const InfoRow = ({ label, value }) => {
    return (
        <div className="flex items-center justify-between">
            <span>{label}</span>
            <span className="heading-text font-bold">{value}</span>
        </div>
    )
}

const FileDetails = ({ onShare }) => {
    const { selectedFile, setSelectedFile, fileList } = useFileManagerStore()
    const [permissions, setPermissions] = useState([])
    const [loadingPermissions, setLoadingPermissions] = useState(false)
    const [fileMetadata, setFileMetadata] = useState(null)
    const [loadingMetadata, setLoadingMetadata] = useState(false)

    const file = useMemo(() => {
        return fileList.find((file) => selectedFile === file.id)
    }, [fileList, selectedFile])

    // Fetch permissions and metadata when file is selected
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedFile) {
                setPermissions([])
                setFileMetadata(null)
                return
            }

            setLoadingPermissions(true)
            setLoadingMetadata(true)
            
            try {
                // Get auth header for the request
                const { getAuthHeader } = await import('@/lib/googleDriveAuth')
                const authHeader = getAuthHeader()
                
                if (!authHeader) {
                    console.error('No Google Drive access token available')
                    return
                }
                
                // Fetch permissions and metadata in parallel
                const [permissionsResponse, metadataResponse] = await Promise.all([
                    fetch(`/api/files/${selectedFile}/permissions`, {
                        headers: { 'Authorization': authHeader }
                    }),
                    fetch(`/api/files/${selectedFile}/metadata`, {
                        headers: { 'Authorization': authHeader }
                    })
                ])
                
                if (permissionsResponse.ok) {
                    const data = await permissionsResponse.json()
                    setPermissions(data.permissions || [])
                } else {
                    console.error('Failed to fetch permissions')
                    setPermissions([])
                }
                
                if (metadataResponse.ok) {
                    const data = await metadataResponse.json()
                    setFileMetadata(data.metadata)
                } else {
                    console.error('Failed to fetch metadata')
                    setFileMetadata(null)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setPermissions([])
                setFileMetadata(null)
            } finally {
                setLoadingPermissions(false)
                setLoadingMetadata(false)
            }
        }

        fetchData()
    }, [selectedFile])

    const handleDrawerClose = () => {
        setSelectedFile('')
        setPermissions([])
    }

    return (
        <Drawer
            title={null}
            closable={false}
            isOpen={Boolean(selectedFile)}
            showBackdrop={false}
            width={350}
            onClose={handleDrawerClose}
            onRequestClose={handleDrawerClose}
        >
            {file && (
                <div>
                    <div className="flex justify-end">
                        <CloseButton onClick={handleDrawerClose} />
                    </div>
                    <div className="mt-10 flex justify-center">
                        {(() => {
                            // Check if this is an image file with a thumbnail
                            const isImageFile = fileMetadata?.mimeType?.startsWith('image/') || 
                                               file.fileType === 'image' ||
                                               file.name?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/)
                            
                            if (isImageFile && fileMetadata?.thumbnailLink && !loadingMetadata) {
                                return (
                                    <div className="relative">
                                        <img 
                                            src={fileMetadata.thumbnailLink} 
                                            alt={file.name}
                                            className="max-w-full max-h-32 object-contain rounded-lg shadow-md"
                                            style={{ maxWidth: '120px', maxHeight: '120px' }}
                                            onError={(e) => {
                                                // Hide the image and show FileIcon instead
                                                e.target.style.display = 'none'
                                                const fallback = e.target.nextSibling
                                                if (fallback) fallback.style.display = 'block'
                                            }}
                                        />
                                        <div style={{ display: 'none' }}>
                                            <FileIcon type={file.fileType} size={120} />
                                        </div>
                                    </div>
                                )
                            }
                            
                            return <FileIcon type={file.fileType} size={120} />
                        })()}
                    </div>
                    <div className="mt-10 text-center">
                        <h4 className="break-words" title={file.name}>
                            {truncateFileName(file.name, 30)}
                        </h4>
                    </div>
                    <div className="mt-8">
                        <h6>Info</h6>
                        <div className="mt-4 flex flex-col gap-4">
                            <InfoRow
                                label="Tamanho"
                                value={file.sizeDisplay || fileSizeUnit(file.size)}
                            />
                            <InfoRow
                                label="Tipo"
                                value={<FileType type={file.fileType} />}
                            />
                            <InfoRow
                                label="Criado em"
                                value={dayjs
                                    .unix(file.uploadDate)
                                    .format('MMM DD, YYYY')}
                            />
                            <InfoRow
                                label="Última modificação"
                                value={dayjs
                                    .unix(file.activities[0].timestamp)
                                    .format('MMM DD, YYYY')}
                            />
                        </div>
                    </div>
                    <div className="mt-10">
                        <div className="flex justify-between items-center">
                            <h6>Compartilhado com</h6>
                            <Button
                                type="button"
                                shape="circle"
                                icon={<TbPlus />}
                                size="xs"
                                onClick={() => onShare(file.id)}
                            />
                        </div>
                        <div className="mt-6 flex flex-col gap-4">
                            {loadingPermissions ? (
                                <div className="text-center text-gray-500">Carregando permissões...</div>
                            ) : permissions.length === 0 ? (
                                <div className="text-center text-gray-500">Nenhum compartilhamento</div>
                            ) : (
                                permissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Avatar 
                                            src={permission.photoLink ? `${permission.photoLink}?sz=64` : ''} 
                                            alt={permission.displayName || permission.emailAddress || 'User'} 
                                        />
                                        <div>
                                            <div className="heading-text font-semibold">
                                                {permission.displayName || permission.emailAddress || 'Unknown User'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {permission.role} • {permission.type}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default FileDetails

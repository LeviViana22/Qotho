'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { TbDownload, TbPrinter, TbFileTypePdf } from 'react-icons/tb'

const AttachmentViewer = ({ isOpen, onClose, attachment }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    // Function to clean and validate base64 data
    const cleanBase64Data = (data) => {
        if (!data) return ''
        
        // Remove all whitespace, newlines, carriage returns, tabs
        let cleaned = data.replace(/[\s\n\r\t]/g, '')
        
        // Remove any non-base64 characters (only allow A-Z, a-z, 0-9, +, /, =)
        cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '')
        
        // Ensure the string length is valid for base64 (must be multiple of 4)
        while (cleaned.length % 4 !== 0) {
            cleaned += '='
        }
        
        return cleaned
    }

    // Function to create blob URL (alternative to data URL)
    const getBlobUrl = () => {
        if (!attachment?.data) return ''
        
        try {
            const cleanData = cleanBase64Data(attachment.data)
            const byteCharacters = atob(cleanData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            
            const mimeType = attachment.type === 'pdf' ? 'application/pdf' :
                            attachment.type === 'png' ? 'image/png' :
                            attachment.type === 'jpg' || attachment.type === 'jpeg' ? 'image/jpeg' :
                            'application/octet-stream'
            
            const blob = new Blob([byteArray], { type: mimeType })
            const url = window.URL.createObjectURL(blob)
            
            console.log('Blob URL created:', url)
            return url
        } catch (error) {
            console.error('Error creating blob URL:', error)
            return ''
        }
    }

    // Reset loading state when dialog opens or attachment changes
    useEffect(() => {
        if (isOpen && attachment) {
            setIsLoading(true)
            setLoadError(false)
            
            // Add timeout for PDF loading - if it takes too long, show error
            if (attachment.type === 'pdf') {
                const timeout = setTimeout(() => {
                    if (isLoading) {
                        console.log('PDF loading timeout - showing error')
                        setIsLoading(false)
                        setLoadError(true)
                    }
                }, 8000) // 8 second timeout
                
                // Also add a shorter timeout to check if content is actually loaded
                const contentCheck = setTimeout(() => {
                    console.log('Checking if PDF content is loaded...')
                    // Try to detect if PDF content is actually visible
                    const iframe = document.querySelector('iframe[title="' + getFileName() + '"]')
                    if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
                        console.log('PDF content detected, hiding loading')
                        setIsLoading(false)
                        setLoadError(false)
                    }
                }, 3000) // 3 second content check
                
                // Add a more aggressive check - try to detect PDF rendering
                const renderCheck = setInterval(() => {
                    const iframe = document.querySelector('iframe[title="' + getFileName() + '"]')
                    if (iframe && iframe.contentDocument) {
                        try {
                            // Check if PDF viewer has rendered content
                            const pdfViewer = iframe.contentDocument.querySelector('embed[type="application/pdf"]') ||
                                            iframe.contentDocument.querySelector('object[type="application/pdf"]') ||
                                            iframe.contentDocument.querySelector('canvas') ||
                                            iframe.contentDocument.querySelector('img')
                            
                            if (pdfViewer) {
                                console.log('PDF renderer detected, hiding loading')
                                setIsLoading(false)
                                setLoadError(false)
                                clearInterval(renderCheck)
                            }
                        } catch (e) {
                            // Cross-origin restrictions, ignore
                        }
                    }
                }, 1000) // Check every second
                
                return () => {
                    clearTimeout(timeout)
                    clearTimeout(contentCheck)
                    clearInterval(renderCheck)
                }
            }
        }
    }, [isOpen, attachment, isLoading])

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            // Cleanup any blob URLs we created
            if (attachment?.type === 'pdf') {
                // We could store the blob URL in state and revoke it here
                console.log('Cleaning up blob URLs')
            }
        }
    }, [attachment])

    const handleDownload = () => {
        if (!attachment?.data) return
        
        try {
            console.log('Starting download for:', attachment.type, 'file')
            
            // Clean the base64 data using our validation function
            const cleanData = cleanBase64Data(attachment.data)
            
            console.log('Original data length:', attachment.data.length)
            console.log('Cleaned data length:', cleanData.length)
            console.log('Cleaned data preview:', cleanData.substring(0, 100))
            
            // Create a blob from the base64 data
            const byteCharacters = atob(cleanData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            
            // Use correct MIME type based on file type
            const mimeType = attachment.type === 'pdf' ? 'application/pdf' : 
                            attachment.type === 'png' ? 'image/png' :
                            attachment.type === 'jpg' || attachment.type === 'jpeg' ? 'image/jpeg' :
                            'application/octet-stream'
            
            console.log('Creating blob with MIME type:', mimeType, 'size:', byteArray.length)
            const blob = new Blob([byteArray], { type: mimeType })
            
            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = attachment.filename || attachment.file || attachment.name || `attachment.${attachment.type || 'pdf'}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            console.log('Download completed successfully')
        } catch (error) {
            console.error('Error downloading file:', error)
            console.error('Original data preview:', attachment.data?.substring(0, 200))
            console.error('Data contains newlines:', attachment.data?.includes('\n'))
            console.error('Data contains carriage returns:', attachment.data?.includes('\r'))
        }
    }

    const handlePrint = () => {
        if (!attachment?.data) return
        
        try {
            // Clean the base64 data using our validation function
            const cleanData = cleanBase64Data(attachment.data)
            
            // Create a blob from the base64 data
            const byteCharacters = atob(cleanData)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            
            // Use correct MIME type based on file type
            const mimeType = attachment.type === 'pdf' ? 'application/pdf' : 
                            attachment.type === 'png' ? 'image/png' :
                            attachment.type === 'jpg' || attachment.type === 'jpeg' ? 'image/jpeg' :
                            'application/octet-stream'
            
            const blob = new Blob([byteArray], { type: mimeType })
            
            // Create object URL and open in new window for printing
            const url = window.URL.createObjectURL(blob)
            const printWindow = window.open(url, '_blank')
            
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print()
                    // Clean up after printing
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url)
                    }, 1000)
                }
            }
        } catch (error) {
            console.error('Error printing file:', error)
        }
    }

    const getFileName = () => {
        return attachment?.filename || attachment?.file || attachment?.name || 'attachment'
    }

    const getFileType = () => {
        return attachment?.type || 'pdf'
    }

                const getDataUrl = () => {
            if (!attachment?.data) return ''
            
            // Clean the base64 data for viewing using our validation function
            const cleanData = cleanBase64Data(attachment.data)
            
            console.log('getDataUrl called:')
            console.log('- Original data length:', attachment.data.length)
            console.log('- Cleaned data length:', cleanData.length)
            console.log('- Data starts with:', cleanData.substring(0, 50))
            console.log('- Data ends with:', cleanData.substring(cleanData.length - 20))
            console.log('- Is valid base64:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanData))
            
            const mimeType = attachment.type === 'pdf' ? 'application/pdf' :
                            attachment.type === 'png' ? 'image/png' :
                            attachment.type === 'jpg' || attachment.type === 'jpeg' ? 'image/jpeg' :
                            'application/octet-stream'
            
            const dataUrl = `data:${mimeType};base64,${cleanData}`
            console.log('- Generated data URL length:', dataUrl.length)
            
            return dataUrl
        }

    const handleIframeLoad = () => {
        console.log('Iframe loaded successfully')
        setIsLoading(false)
        setLoadError(false)
    }

    const handleIframeLoadStart = () => {
        console.log('Iframe load started')
        setIsLoading(true)
        setLoadError(false)
    }

    const handleIframeError = () => {
        console.log('Iframe failed to load')
        setIsLoading(false)
        setLoadError(true)
    }

    const handleImageLoad = () => {
        console.log('Image loaded successfully')
        setIsLoading(false)
        setLoadError(false)
    }

    const handleImageError = () => {
        console.log('Image failed to load')
        setIsLoading(false)
        setLoadError(true)
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={900} height="80vh">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <TbFileTypePdf className="text-2xl text-red-500" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {getFileName()}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {attachment?.size} • PDF Document
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            icon={<TbDownload />}
                            onClick={handleDownload}
                        >
                            Download
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            icon={<TbPrinter />}
                            onClick={handlePrint}
                        >
                            Print
                        </Button>

                    </div>
                </div>

                {/* File Viewer */}
                <div className="flex-1 p-4">
                    {attachment?.data ? (
                        <div className="h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative">
                            {attachment.type === 'pdf' ? (
                                <>
                                    {/* Try multiple PDF viewing methods */}
                                    <div className="w-full h-full">
                                        {/* Method 1: Blob URL (often works better for large files) */}
                                        <embed
                                            src={getBlobUrl()}
                                            type="application/pdf"
                                            className="w-full h-full"
                                            style={{ minHeight: '600px' }}
                                        />
                                        
                                        {/* Method 2: Data URL as fallback */}
                                        <object
                                            data={getDataUrl()}
                                            type="application/pdf"
                                            className="w-full h-full hidden"
                                            onLoad={handleIframeLoad}
                                            onError={handleIframeError}
                                            style={{ minHeight: '600px' }}
                                        >
                                            <p>PDF cannot be displayed. <a href={getDataUrl()} target="_blank" rel="noopener noreferrer">Click here to view</a></p>
                                        </object>
                                        
                                        {/* Method 3: Iframe as last resort */}
                                        <iframe
                                            src={getDataUrl()}
                                            className="w-full h-full hidden"
                                            title={getFileName()}
                                            onLoad={handleIframeLoad}
                                            onError={handleIframeError}
                                            style={{ minHeight: '600px' }}
                                            onLoadStart={handleIframeLoadStart}
                                        />
                                    </div>
                                </>
                            ) : (
                                <img
                                    src={getDataUrl()}
                                    alt={getFileName()}
                                    className="w-full h-full object-contain"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            )}
                            
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Loading {attachment.type === 'pdf' ? 'PDF' : 'image'}...
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {loadError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                    <div className="text-center">
                                        <TbFileTypePdf className="text-6xl text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                                            Failed to load {attachment.type === 'pdf' ? 'PDF' : 'image'}
                                        </p>
                                        <p className="text-xs text-gray-400 mb-3">
                                            Try downloading the file instead
                                        </p>
                                        {attachment.type === 'pdf' && (
                                            <a 
                                                href={getDataUrl()} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 underline text-sm"
                                            >
                                                Open PDF in new tab
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                                <TbFileTypePdf className="text-6xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No file data available
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    )
}

export default AttachmentViewer

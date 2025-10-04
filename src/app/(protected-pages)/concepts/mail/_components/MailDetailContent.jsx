'use client'
import IconText from '@/components/shared/IconText'
import Avatar from '@/components/ui/Avatar'
import ScrollBar from '@/components/ui/ScrollBar'
import FileIcon from '@/components/view/FileIcon'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'

import { HiOutlineClock } from 'react-icons/hi'
import { TbDownload } from 'react-icons/tb'

const MailDetailContent = (props) => {
    const { mail = {}, ref } = props

    const handleAttachmentClick = (attachment) => {
        // Open file in new tab
        console.log('File clicked - opening in new tab')
        try {
            // Clean the base64 data - remove ALL whitespace, newlines, and invalid characters
            const cleanData = attachment.data.replace(/[\s\n\r\t]/g, '')
            
            // Remove any non-base64 characters (only allow A-Z, a-z, 0-9, +, /, =)
            const validData = cleanData.replace(/[^A-Za-z0-9+/=]/g, '')
            
            // Ensure the string length is valid for base64 (must be multiple of 4)
            let finalData = validData
            while (finalData.length % 4 !== 0) {
                finalData += '='
            }
            
            const mimeType = attachment.type === 'pdf' ? 'application/pdf' :
                            attachment.type === 'png' ? 'image/png' :
                            attachment.type === 'jpg' || attachment.type === 'jpeg' ? 'image/jpeg' :
                            'application/octet-stream'
            
            const dataUrl = `data:${mimeType};base64,${finalData}`
            window.open(dataUrl, '_blank')
        } catch (error) {
            console.error('Error opening file:', error)
        }
    }

    const handleDownload = (attachment, event) => {
        event.stopPropagation() // Prevent opening the file
        event.preventDefault() // Prevent default button behavior
        console.log('Download button clicked - preventing file opening')
        try {
            // Clean the base64 data - remove ALL whitespace, newlines, and invalid characters
            const cleanData = attachment.data.replace(/[\s\n\r\t]/g, '')
            
            // Remove any non-base64 characters (only allow A-Z, a-z, 0-9, +, /, =)
            const validData = cleanData.replace(/[^A-Za-z0-9+/=]/g, '')
            
            // Ensure the string length is valid for base64 (must be multiple of 4)
            let finalData = validData
            while (finalData.length % 4 !== 0) {
                finalData += '='
            }
            
            console.log('Download - Original length:', attachment.data.length)
            console.log('Download - Cleaned length:', finalData.length)
            console.log('Download - Data preview:', finalData.substring(0, 50))
            
            const byteCharacters = atob(finalData)
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
            console.error('Original data preview:', attachment.data?.substring(0, 100))
        }
    }

    return (
        <div className="absolute top-0 left-0 h-full w-full ">
            <ScrollBar
                ref={ref}
                autoHide
                className="overflow-y-auto h-[calc(100%-100px)]"
            >
                <div className="h-full px-6">
                    {/* Debug: Log the mail data structure */}
                    {console.log('MailDetailContent - mail data:', {
                        messageCount: mail.message?.length,
                        firstMessage: mail.message?.[0] ? {
                            id: mail.message[0].id,
                            content: mail.message[0].content?.substring(0, 100) + '...',
                            contentLength: mail.message[0].content?.length,
                            attachmentCount: mail.message[0].attachment?.length
                        } : null
                    })}
                    
                    {mail.message?.map((msg, index) => (
                        <div key={msg.id}>
                            {/* Debug: Log each message */}
                            {console.log(`Message ${index}:`, {
                                id: msg.id,
                                content: msg.content?.substring(0, 100) + '...',
                                contentLength: msg.content?.length,
                                attachmentCount: msg.attachment?.length
                            })}
                            <div
                                className={classNames(
                                    'py-8 ltr:pr-4 rtl:pl-4',
                                    !isLastChild(mail.message, index) &&
                                        'border-b border-gray-200 dark:border-gray-700',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            shape="circle"
                                            src={msg.avatar}
                                        />
                                        <div>
                                            <div className="font-bold truncate heading-text">
                                                {msg.name}
                                            </div>
                                            <div>
                                                To:{' '}
                                                {mail.mail?.map((to, index) => (
                                                    <span key={to + index}>
                                                        {to}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <IconText
                                        icon={
                                            <HiOutlineClock className="text-lg" />
                                        }
                                    >
                                        <span className="font-semibold">
                                            {msg.date}
                                        </span>
                                    </IconText>
                                </div>
                                <div className="mt-8">
                                    {msg.content ? (
                                        <div className="prose dark:prose-invert max-w-none">
                                            {(() => {
                                                
                                                // Target specific Gmail email by subject and sender
                                                const isSpecificGmailEmail = (msg.subject === 'teste' && msg.from?.includes('Hydeless')) ||
                                                                           (msg.title === 'teste' && msg.from?.includes('Hydeless')) ||
                                                                           (mail.title === 'teste' && msg.from?.includes('Hydeless')) ||
                                                                           (msg.subject === 'teste' && msg.from?.includes('gmail.com')) ||
                                                                           (msg.title === 'teste' && msg.from?.includes('gmail.com')) ||
                                                                           (mail.title === 'teste' && msg.from?.includes('gmail.com'));
                                                
                                                console.log('Email detection:', {
                                                    msgSubject: msg.subject,
                                                    msgTitle: msg.title,
                                                    mailTitle: mail.title,
                                                    from: msg.from,
                                                    isSpecificGmailEmail,
                                                    contentLength: msg.content?.length,
                                                    contentPreview: msg.content?.substring(0, 100)
                                                });
                                                

                                                
                                                if (isSpecificGmailEmail) {
                                                    // For the specific Gmail email, show as plain text (already cleaned on server)
                                                    console.log('Gmail email content:', {
                                                        content: msg.content,
                                                        contentLength: msg.content?.length,
                                                        contentPreview: msg.content?.substring(0, 200)
                                                    });
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                                                            <div className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-gray-100">{msg.content}</div>
                                                        </div>
                                                    );
                                                } else if (msg.content.includes('<html') || msg.content.includes('<HTML') || msg.content.includes('<body') || msg.content.includes('<p>')) {
                                                    // Check if this is a professional HTML email (like Squarespace) that should preserve styling
                                                    const isProfessionalHtmlEmail = msg.content.includes('<!DOCTYPE html>') || 
                                                                                   msg.content.includes('squarespace.com') || 
                                                                                   msg.content.includes('Não perca seu progresso')
                                                    
                                                    if (isProfessionalHtmlEmail) {
                                                        // For professional HTML emails, minimal cleaning to preserve styling
                                                        return (
                                                            <>
                                                                <style>
                                                                    {`
                                                                        .email-content-wrapper * {
                                                                            background-color: transparent !important;
                                                                            background: none !important;
                                                                        }
                                                                        .email-content-wrapper {
                                                                            background-color: white !important;
                                                                            max-width: 100% !important;
                                                                            overflow-x: auto !important;
                                                                        }
                                                                        .email-content-wrapper table {
                                                                            margin: 0 auto !important;
                                                                        }
                                                                        .email-content-wrapper .logo-container,
                                                                        .email-content-wrapper .p30,
                                                                        .email-content-wrapper .p45-30 {
                                                                            text-align: center !important;
                                                                        }
                                                                    `}
                                                                </style>
                                                                <div 
                                                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border email-content-wrapper"
                                                                    style={{ backgroundColor: 'white !important' }}
                                                                    dangerouslySetInnerHTML={{ 
                                                                        __html: msg.content
                                                                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                                                                        .replace(/Content-Disposition:[^]*?(?=\n\n|\n[A-Z]|$)/g, '') // Remove Content-Disposition blocks
                                                                        .replace(/--[a-zA-Z0-9_=+\-]{10,}/g, '') // Remove boundary markers
                                                                    }}
                                                                />
                                                            </>
                                                        );
                                                    } else {
                                                        // For other emails with HTML, use the existing HTML rendering
                                                        return (
                                                            <div 
                                                                className="bg-white dark:bg-gray-800 p-4 rounded-lg border email-content-wrapper"
                                                                style={{ backgroundColor: 'white !important' }}
                                                                dangerouslySetInnerHTML={{ 
                                                                    __html: `<style>
                                                                        .email-content-wrapper * {
                                                                            background-color: transparent !important;
                                                                            background: none !important;
                                                                        }
                                                                        .email-content-wrapper {
                                                                            background-color: white !important;
                                                                        }
                                                                    </style>` + msg.content
                                                                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                                                                        .replace(/bgcolor="[^"]*"/g, '') // Remove bgcolor attributes
                                                                        .replace(/background="[^"]*"/g, '') // Remove background attributes
                                                                        .replace(/background-color="[^"]*"/g, '') // Remove background-color attributes
                                                                        .replace(/style="[^"]*background[^"]*"/g, 'style=""') // Remove style with background
                                                                        .replace(/style="\s*"/g, '') // Remove empty style attributes
                                                                        .replace(/<body[^>]*>/gi, '<body>') // Remove all body attributes
                                                                        .replace(/<html[^>]*>/gi, '<html>') // Remove all html attributes
                                                                        .replace(/<div[^>]*>/gi, '<div>') // Remove all div attributes
                                                                        .replace(/Content-Disposition:[^]*?(?=\n\n|\n[A-Z]|$)/g, '') // Remove Content-Disposition blocks
                                                                        .replace(/--[a-zA-Z0-9_=+\-]{10,}/g, '') // Remove boundary markers
                                                                        .replace(/<div[^>]*class="[^"]*gmail_signature[^"]*"[^]*?<\/div>/gi, '') // Remove Gmail signatures
                                                                        .replace(/<div[^>]*data-smartmail="gmail_signature"[^]*?<\/div>/gi, '') // Remove Gmail signatures
                                                                        .replace(/<img[^>]*src="[^"]*mail-sig-[^"]*"[^>]*>/gi, '') // Remove broken Gmail images
                                                                        .replace(/<img[^>]*src="[^"]*ci3\.googleusercontent\.com[^"]*"[^>]*>/gi, '') // Remove broken Gmail images
                                                                }}
                                                            />
                                                        );
                                                    }
                                                } else {
                                                    // For plain text emails
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                                                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-gray-100">
                                                                {msg.content
                                                                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                                                                    .replace(/Content-Disposition:[^]*?(?=\n\n|\n[A-Z]|$)/g, '') // Remove Content-Disposition blocks
                                                                    .replace(/--[a-zA-Z0-9_=+\-]{10,}/g, '') // Remove boundary markers
                                                                }
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic">
                                            No content available
                                            {/* Debug: Show more info when content is missing */}
                                            {console.log('Content missing for message:', {
                                                id: msg.id,
                                                content: msg.content,
                                                contentType: typeof msg.content,
                                                contentLength: msg.content?.length
                                            })}
                                        </div>
                                    )}
                                </div>
                                {msg.attachment?.length > 0 && (
                                    <div className="mt-6">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            Anexos ({msg.attachment.length})
                                        </div>
                                        <div className="inline-flex flex-wrap gap-4">
                                            {msg.attachment.map((item, index) => (
                                                <div key={item.filename || item.file || item.name || `attachment-${index}`} className="relative">
                                                    {item.type === 'image' && item.data ? (
                                                        <div 
                                                            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative"
                                                            onClick={() => handleAttachmentClick(item)}
                                                        >
                                                            <img 
                                                                src={`data:image/jpeg;base64,${item.data}`}
                                                                alt={item.filename || item.file || item.name || 'Attachment'}
                                                                className="max-w-xs max-h-48 object-contain"
                                                            />
                                                            <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 truncate" title={item.filename || item.file || item.name || 'Unknown file'}>
                                                                {(() => {
                                                                    const filename = item.filename || item.file || item.name || 'Unknown file'
                                                                    return filename.length > 20 ? filename.substring(0, 20) + '...' : filename
                                                                })()}
                                                            </div>
                                                            {/* Download button for images */}
                                                            <button
                                                                onClick={(e) => handleDownload(item, e)}
                                                                className="absolute bottom-2 right-2 p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 z-10"
                                                                title="Download"
                                                            >
                                                                <TbDownload className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className={`min-w-full md:min-w-[230px] h-16 rounded-2xl dark:bg-gray-800 border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-700 px-3.5 inline-flex items-center gap-2 transition-all relative ${
                                                                (item.type === 'pdf' || item.type === 'png' || item.type === 'jpg' || item.type === 'jpeg' || item.type === 'gif') 
                                                                    ? 'cursor-pointer' 
                                                                    : 'cursor-default'
                                                            }`}
                                                            onClick={(item.type === 'pdf' || item.type === 'png' || item.type === 'jpg' || item.type === 'jpeg' || item.type === 'gif') ? () => handleAttachmentClick(item) : undefined}
                                                        >
                                                            <FileIcon type={item.type} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={item.filename || item.file || item.name || 'Unknown file'}>
                                                                    {(() => {
                                                                        const filename = item.filename || item.file || item.name || 'Unknown file'
                                                                        return filename.length > 25 ? filename.substring(0, 25) + '...' : filename
                                                                    })()}
                                                                </div>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {item.size}
                                                                </span>
                                                            </div>
                                                            {/* Download button for files */}
                                                            <button
                                                                onClick={(e) => handleDownload(item, e)}
                                                                className="absolute bottom-2 right-2 p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 z-10"
                                                                title="Download"
                                                            >
                                                                <TbDownload className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollBar>
        </div>
    )
}

export default MailDetailContent

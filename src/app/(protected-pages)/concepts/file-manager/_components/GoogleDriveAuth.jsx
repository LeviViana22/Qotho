'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { TbBrandGoogleDrive, TbLogout } from 'react-icons/tb'
import { removeGoogleDriveTokens } from '@/lib/googleDriveAuth'

const GoogleDriveAuth = ({ onAuthSuccess, onDisconnect, isConnected = false }) => {
    const [showAuthDialog, setShowAuthDialog] = useState(false)
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    const handleGoogleAuth = async () => {
        setIsAuthenticating(true)
        try {
            // Get Google Drive auth URL for popup
            const response = await fetch('/api/auth/google-drive?popup=true')
            const data = await response.json()
            
            if (data.authUrl) {
                // Open OAuth in a new popup window
                const popup = window.open(
                    data.authUrl,
                    'googleDriveAuth',
                    'width=600,height=700,scrollbars=yes,resizable=yes'
                )
                
                if (!popup) {
                    alert('Popup blocked! Please allow popups for this site.')
                    setIsAuthenticating(false)
                    return
                }
                
                // Listen for the popup to close or send a message
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed)
                        setIsAuthenticating(false)
                        // Small delay to ensure tokens are stored
                        setTimeout(() => {
                            // Check if we have tokens in localStorage
                            const storedTokens = localStorage.getItem('googleDriveTokens')
                            if (storedTokens) {
                                console.log('Popup closed, tokens found, triggering auth success')
                                // Notify parent window that auth was successful
                                if (onAuthSuccess) {
                                    onAuthSuccess()
                                }
                            } else {
                                console.log('Popup closed, no tokens found')
                            }
                        }, 1000)
                    }
                }, 1000)
                
                // Listen for messages from the popup
                const handleMessage = (event) => {
                    if (event.origin !== window.location.origin) return
                    
                    if (event.data.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
                        clearInterval(checkClosed)
                        popup.close()
                        setIsAuthenticating(false)
                        // Small delay to ensure tokens are stored
                        setTimeout(() => {
                            if (onAuthSuccess) {
                                onAuthSuccess()
                            }
                        }, 500)
                    } else if (event.data.type === 'GOOGLE_DRIVE_AUTH_ERROR') {
                        clearInterval(checkClosed)
                        popup.close()
                        setIsAuthenticating(false)
                        console.error('Auth error:', event.data.error)
                    }
                }
                
                window.addEventListener('message', handleMessage)
                
                // Clean up listener when popup closes
                const originalCheckClosed = checkClosed
                const cleanup = () => {
                    clearInterval(originalCheckClosed)
                    window.removeEventListener('message', handleMessage)
                }
                
                // Set up cleanup
                setTimeout(() => {
                    if (!popup.closed) {
                        cleanup()
                    }
                }, 300000) // 5 minutes timeout
                
            } else {
                console.error('No auth URL received')
                setIsAuthenticating(false)
            }
        } catch (error) {
            console.error('Error initiating Google Drive auth:', error)
            setIsAuthenticating(false)
        }
    }

    const handleDisconnect = () => {
        removeGoogleDriveTokens()
        if (onDisconnect) {
            onDisconnect()
        }
    }

    const handleOpenDrive = () => {
        // Navigate to the file manager with the current drive
        window.location.href = '/concepts/file-manager'
    }

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="text-6xl mb-4 flex justify-center">
                    <TbBrandGoogleDrive className="text-blue-500" />
                </div>
                {isConnected ? (
                    <>
                        <h3 className="text-xl font-semibold mb-2">Google Drive Conectado</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Seu Google Drive está conectado e pronto para uso
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="solid"
                                size="lg"
                                onClick={handleOpenDrive}
                                icon={<TbBrandGoogleDrive />}
                            >
                                Entrar
                            </Button>
                            <Button
                                variant="plain"
                                size="sm"
                                onClick={handleDisconnect}
                                icon={<TbLogout />}
                            >
                                Sair
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-semibold mb-2">Conectar ao Google Drive</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Conecte sua conta do Google Drive para gerenciar seus arquivos
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="solid"
                                size="lg"
                                loading={isAuthenticating}
                                onClick={handleGoogleAuth}
                                icon={<TbBrandGoogleDrive />}
                            >
                                Conectar ao Google Drive
                            </Button>
                            <Button
                                variant="plain"
                                size="sm"
                                onClick={handleDisconnect}
                                icon={<TbLogout />}
                            >
                                Limpar Tokens Armazenados
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default GoogleDriveAuth

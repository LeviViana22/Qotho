'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { TbBrandGoogleDrive } from 'react-icons/tb'

const GoogleDriveAuth = ({ onAuthSuccess }) => {
    const [showAuthDialog, setShowAuthDialog] = useState(false)
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    const handleGoogleAuth = async () => {
        setIsAuthenticating(true)
        try {
            // Get Google Drive auth URL
            const response = await fetch('/api/auth/google-drive')
            const data = await response.json()
            
            if (data.authUrl) {
                // Redirect to Google OAuth
                window.location.href = data.authUrl
            } else {
                console.error('No auth URL received')
            }
        } catch (error) {
            console.error('Error initiating Google Drive auth:', error)
        } finally {
            setIsAuthenticating(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="text-6xl mb-4 flex justify-center">
                    <TbBrandGoogleDrive className="text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect to Google Drive</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Connect your Google Drive account to manage your files
                </p>
                <Button
                    variant="solid"
                    size="lg"
                    loading={isAuthenticating}
                    onClick={handleGoogleAuth}
                    icon={<TbBrandGoogleDrive />}
                >
                    Connect Google Drive
                </Button>
            </div>
        </div>
    )
}

export default GoogleDriveAuth

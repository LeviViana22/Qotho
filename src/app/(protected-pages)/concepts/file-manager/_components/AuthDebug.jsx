'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { getGoogleDriveTokens, removeGoogleDriveTokens } from '@/lib/googleDriveAuth'

const AuthDebug = () => {
    const [tokens, setTokens] = useState(null)
    const [urlParams, setUrlParams] = useState({})

    useEffect(() => {
        const updateDebugInfo = () => {
            // Check stored tokens
            const storedTokens = getGoogleDriveTokens()
            setTokens(storedTokens)

            // Check URL parameters
            const params = new URLSearchParams(window.location.search)
            const paramObj = {}
            for (const [key, value] of params.entries()) {
                paramObj[key] = value
            }
            setUrlParams(paramObj)
        }

        // Update immediately
        updateDebugInfo()

        // Update when URL changes
        const handlePopState = () => updateDebugInfo()
        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [])

    const clearTokens = () => {
        removeGoogleDriveTokens()
        setTokens(null)
    }

    const testAuth = async () => {
        try {
            const response = await fetch('/api/files')
            console.log('Auth test response:', response.status)
        } catch (error) {
            console.error('Auth test error:', error)
        }
    }

    const refreshDebug = () => {
        const storedTokens = getGoogleDriveTokens()
        setTokens(storedTokens)

        const params = new URLSearchParams(window.location.search)
        const paramObj = {}
        for (const [key, value] of params.entries()) {
            paramObj[key] = value
        }
        setUrlParams(paramObj)
    }

    const processTokensFromURL = () => {
        const params = new URLSearchParams(window.location.search)
        const tokensParam = params.get('tokens')
        const success = params.get('success')
        
        if (success === 'auth_success' && tokensParam) {
            try {
                console.log('Manually processing tokens from URL...')
                const tokenData = JSON.parse(atob(tokensParam))
                localStorage.setItem('googleDriveTokens', JSON.stringify(tokenData))
                setTokens(tokenData)
                console.log('Tokens stored successfully!')
                alert('Tokens processed and stored! Please refresh the page.')
            } catch (error) {
                console.error('Error processing tokens:', error)
                alert('Error processing tokens: ' + error.message)
            }
        } else {
            alert('No tokens found in URL')
        }
    }

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-4">Authentication Debug</h3>
            
            <div className="space-y-4">
                <div>
                    <h4 className="font-medium">Stored Tokens:</h4>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
                        {tokens ? JSON.stringify(tokens, null, 2) : 'No tokens stored'}
                    </pre>
                </div>
                
                <div>
                    <h4 className="font-medium">URL Parameters:</h4>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
                        {JSON.stringify(urlParams, null, 2)}
                    </pre>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={clearTokens}>
                        Clear Tokens
                    </Button>
                    <Button size="sm" onClick={testAuth}>
                        Test Auth
                    </Button>
                    <Button size="sm" onClick={refreshDebug}>
                        Refresh
                    </Button>
                    <Button size="sm" onClick={processTokensFromURL}>
                        Process URL Tokens
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AuthDebug

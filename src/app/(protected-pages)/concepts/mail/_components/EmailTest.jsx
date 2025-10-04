'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const EmailTest = () => {
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)

    const testConnection = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/email/status')
            const data = await response.json()
            setStatus(data)
        } catch (error) {
            setStatus({ success: false, error: error.message })
        }
        setLoading(false)
    }

    const testSMTP = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/email/test', {
                method: 'POST'
            })
            const data = await response.json()
            setStatus(data)
        } catch (error) {
            setStatus({ success: false, error: error.message })
        }
        setLoading(false)
    }

    const testFetch = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/email/fetch?folder=INBOX&limit=5')
            const data = await response.json()
            setStatus(data)
        } catch (error) {
            setStatus({ success: false, error: error.message })
        }
        setLoading(false)
    }

    const testNodemailer = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/email/test-nodemailer')
            const data = await response.json()
            setStatus(data)
        } catch (error) {
            setStatus({ success: false, error: error.message })
        }
        setLoading(false)
    }

    const clearCache = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/email/clear-cache', {
                method: 'POST'
            })
            const data = await response.json()
            setStatus(data)
        } catch (error) {
            setStatus({ success: false, error: error.message })
        }
        setLoading(false)
    }

    return (
        <Card className="mb-4">
            <div className="p-4">
                <h4 className="mb-4">Email Connection Test</h4>
                <div className="flex gap-2 mb-4 flex-wrap">
                    <Button size="sm" onClick={testConnection} loading={loading}>
                        Check Config
                    </Button>
                    <Button size="sm" onClick={testSMTP} loading={loading}>
                        Test SMTP
                    </Button>
                    <Button size="sm" onClick={testFetch} loading={loading}>
                        Test Fetch
                    </Button>
                    <Button size="sm" onClick={testNodemailer} loading={loading}>
                        Test Nodemailer
                    </Button>
                    <Button size="sm" onClick={clearCache} loading={loading}>
                        Clear Cache
                    </Button>
                </div>
                {status && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(status, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default EmailTest

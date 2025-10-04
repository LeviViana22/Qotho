'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

const EmailPerformanceMonitor = () => {
    const [performanceData, setPerformanceData] = useState({
        totalEmails: 0,
        loadTime: 0,
        averageSize: 0,
        largeEmails: 0,
        errors: 0
    })
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient) return
        
        // Monitor email loading performance
        const startTime = performance.now()
        
        const handleEmailLoad = () => {
            const endTime = performance.now()
            const loadTime = endTime - startTime
            
            // Get performance data from console logs
            const consoleLogs = []
            const originalLog = console.log
            console.log = (...args) => {
                consoleLogs.push(args.join(' '))
                originalLog(...args)
            }
            
            // Analyze performance after a delay
            setTimeout(() => {
                console.log = originalLog
                
                const emailLogs = consoleLogs.filter(log => 
                    log.includes('Email') && (log.includes('content length') || log.includes('truncating'))
                )
                
                const largeEmails = emailLogs.filter(log => log.includes('too large')).length
                const totalEmails = emailLogs.length
                
                setPerformanceData({
                    totalEmails,
                    loadTime: Math.round(loadTime),
                    averageSize: totalEmails > 0 ? Math.round(loadTime / totalEmails) : 0,
                    largeEmails,
                    errors: consoleLogs.filter(log => log.includes('error') || log.includes('failed')).length
                })
            }, 1000)
        }
        
        // Listen for email loading completion
        const observer = new MutationObserver(handleEmailLoad)
        observer.observe(document.body, { childList: true, subtree: true })
        
        return () => observer.disconnect()
    }, [isClient])

    if (!isClient || performanceData.totalEmails === 0) return null

    return (
        <Card className="mb-4">
            <div className="p-4">
                <h4 className="mb-4">Email Performance Monitor</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                        <div className="font-semibold text-gray-600">Total Emails</div>
                        <div className="text-2xl font-bold">{performanceData.totalEmails}</div>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-600">Load Time</div>
                        <div className="text-2xl font-bold">{performanceData.loadTime}ms</div>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-600">Avg/Email</div>
                        <div className="text-2xl font-bold">{performanceData.averageSize}ms</div>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-600">Large Emails</div>
                        <div className="text-2xl font-bold text-orange-600">{performanceData.largeEmails}</div>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-600">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{performanceData.errors}</div>
                    </div>
                </div>
                {performanceData.largeEmails > 0 && (
                    <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900 rounded text-sm">
                        ⚠️ {performanceData.largeEmails} emails were truncated due to size limits. 
                        Consider implementing pagination for better performance.
                    </div>
                )}
            </div>
        </Card>
    )
}

export default EmailPerformanceMonitor

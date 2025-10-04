'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

export default function TestPasswordPage() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleTestPasswordChange = async () => {
        if (!currentPassword || !newPassword) {
            toast.push(
                <Notification type="danger">Please fill in both passwords</Notification>,
                { placement: 'top-center' }
            )
            return
        }

        setIsLoading(true)
        
        try {
            // Use a test user ID - replace with actual user ID
            const userId = 'cmfki56ez0000tu9k6e2cjkjs' // Replace with actual user ID
            
            const response = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()
            console.log('Password change response:', data)

            if (response.ok) {
                toast.push(
                    <Notification type="success">Password changed successfully!</Notification>,
                    { placement: 'top-center' }
                )
            } else {
                toast.push(
                    <Notification type="danger">Password change failed: {data.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Password change error:', error)
            toast.push(
                <Notification type="danger">Error: {error.message}</Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <h1>Test Password Change</h1>
            <p>This page bypasses the complex layout to test password change functionality.</p>
            
            <div style={{ marginBottom: '20px' }}>
                <label>Current Password:</label>
                <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <label>New Password:</label>
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                />
            </div>
            
            <Button 
                onClick={handleTestPasswordChange}
                disabled={isLoading}
            >
                {isLoading ? 'Testing...' : 'Test Password Change'}
            </Button>
            
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                <p>Check the console for debugging information.</p>
                <p>This will test the password change API directly.</p>
            </div>
        </div>
    )
}

'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import useUserStore from '@/stores/userStore'

const TestUserPasswordPage = () => {
    const { currentUser } = useUserStore()
    const [testResults, setTestResults] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        console.log('TestUserPasswordPage mounted')
        console.log('Current user:', currentUser)
    }, [currentUser])

    const testUserPassword = async () => {
        if (!currentUser) {
            setTestResults('No current user found')
            return
        }

        setIsLoading(true)
        setTestResults('Testing...')

        try {
            // Test 1: Get user data
            console.log('Testing user data for:', currentUser.id)
            const userResponse = await fetch(`/api/users/${currentUser.id}`)
            const userData = await userResponse.json()
            console.log('User data response:', userData)

            // Test 2: Try password change with wrong password
            console.log('Testing password change with wrong password')
            const passwordResponse = await fetch(`/api/users/${currentUser.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                }),
            })

            const passwordData = await passwordResponse.json()
            console.log('Password change response:', passwordData)

            setTestResults(`
User ID: ${currentUser.id}
User Name: ${currentUser.name}
User Email: ${currentUser.email}
User Role: ${currentUser.role}

User Data API Response: ${JSON.stringify(userData, null, 2)}

Password Change API Response: ${JSON.stringify(passwordData, null, 2)}
            `)

            if (passwordResponse.ok) {
                toast.push(
                    <Notification type="success">Test completed successfully!</Notification>,
                    { placement: 'top-center' }
                )
            } else {
                toast.push(
                    <Notification type="danger">Test completed with errors: {passwordData.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Test error:', error)
            setTestResults(`Error: ${error.message}`)
            toast.push(
                <Notification type="danger">Test failed: {error.message}</Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    const testLoginWithCreatedUser = async () => {
        setIsLoading(true)
        setTestResults('Testing login with created user...')

        try {
            // Try to login with the created user
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'test@example.com', // Use the email of the created user
                    password: 'test123', // Use the password you set when creating the user
                }),
            })

            const data = await response.json()
            console.log('Login test response:', data)

            setTestResults(prev => prev + `\n\nLogin Test Response: ${JSON.stringify(data, null, 2)}`)

            if (response.ok) {
                toast.push(
                    <Notification type="success">Login test successful!</Notification>,
                    { placement: 'top-center' }
                )
            } else {
                toast.push(
                    <Notification type="danger">Login test failed: {data.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Login test error:', error)
            setTestResults(prev => prev + `\n\nLogin Test Error: ${error.message}`)
            toast.push(
                <Notification type="danger">Login test failed: {error.message}</Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Password Test</h1>
            
            <div className="mb-4">
                <p><strong>Current User:</strong> {currentUser ? `${currentUser.name} (${currentUser.email})` : 'None'}</p>
            </div>

            <div className="mb-4 space-x-2">
                <Button 
                    variant="solid" 
                    onClick={testUserPassword}
                    disabled={isLoading}
                >
                    Test User Password API
                </Button>
                
                <Button 
                    variant="outline" 
                    onClick={testLoginWithCreatedUser}
                    disabled={isLoading}
                >
                    Test Login with Created User
                </Button>
            </div>

            {isLoading && (
                <div className="mb-4 text-blue-600">Loading...</div>
            )}

            {testResults && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Test Results:</h3>
                    <pre className="whitespace-pre-wrap text-sm">{testResults}</pre>
                </div>
            )}

            <div className="mt-6">
                <h3 className="font-bold mb-2">Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>First, create a new user in the roles-permissions page</li>
                    <li>Note the email and password you used</li>
                    <li>Click "Test User Password API" to check if the user was created correctly</li>
                    <li>Click "Test Login with Created User" to test if the user can login</li>
                    <li>Check the console and test results for detailed information</li>
                </ol>
            </div>
        </div>
    )
}

export default TestUserPasswordPage

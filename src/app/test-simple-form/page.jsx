'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const TestSimpleFormPage = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)

    console.log('TestSimpleFormPage rendered')

    const handleInputChange = (field, value) => {
        console.log(`Input changed: ${field} = ${value}`)
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log('Form submitted with data:', formData)
        
        if (!formData.currentPassword || !formData.newPassword) {
            toast.push(
                <Notification type="danger">Please fill in all fields</Notification>,
                { placement: 'top-center' }
            )
            return
        }

        setIsLoading(true)
        
        try {
            // Test API call
            const response = await fetch('/api/users/cmfki56ez0000tu9k6e2cjkjs/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            })

            const data = await response.json()
            console.log('API response:', data)

            if (response.ok) {
                toast.push(
                    <Notification type="success">Password updated successfully!</Notification>,
                    { placement: 'top-center' }
                )
            } else {
                toast.push(
                    <Notification type="danger">Error: {data.error}</Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error) {
            console.error('Error:', error)
            toast.push(
                <Notification type="danger">Error: {error.message}</Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleButtonClick = () => {
        console.log('Button clicked!')
        toast.push(
            <Notification type="success">Button clicked successfully!</Notification>,
            { placement: 'top-center' }
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Simple Form Test</h1>
            
            <div className="mb-4">
                <Button onClick={handleButtonClick}>
                    Test Button Click
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <Input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                    />
                </div>

                <Button 
                    type="submit" 
                    variant="solid"
                    disabled={isLoading}
                >
                    {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Form Data:</h3>
                <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
            </div>
        </div>
    )
}

export default TestSimpleFormPage

'use client'
import SignIn from '@/components/auth/SignIn'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const SignInClient = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSignIn = async ({ values, setSubmitting, setMessage }) => {
        setIsLoading(true)
        setSubmitting(true)

        try {
            // First check if user is blocked
            const statusResponse = await fetch('/api/auth/check-user-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: values.email }),
            })

            if (statusResponse.status === 403) {
                const statusData = await statusResponse.json()
                setMessage(statusData.error)
                toast.push(
                    <Notification type="danger" duration={5000}>
                        {statusData.error}
                    </Notification>
                )
                return
            }

            // If user is active, proceed with sign in
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (result?.error) {
                setMessage('Invalid credentials!')
                toast.push(
                    <Notification type="danger" duration={3000}>
                        Credenciais inválidas!
                    </Notification>
                )
            } else if (result?.ok) {
                toast.push(
                    <Notification type="success" duration={3000}>
                        Bem vindo de volta!
                    </Notification>
                )
                // Refresh the page to update session state
                window.location.href = '/dashboards/project'
            }
        } catch (error) {
            console.error('Sign in error:', error)
            setMessage('Something went wrong!')
            toast.push(
                <Notification type="danger" duration={3000}>
                    Something went wrong!
                </Notification>
            )
        } finally {
            setIsLoading(false)
            setSubmitting(false)
        }
    }

    return (
        <SignIn 
            onSignIn={handleSignIn} 
            onOauthSignIn={null}
            signUpUrl={null}
            forgetPasswordUrl={null}
        />
    )
}

export default SignInClient

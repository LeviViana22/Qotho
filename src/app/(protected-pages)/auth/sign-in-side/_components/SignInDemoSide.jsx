'use client'
import SignIn from '@/components/auth/SignIn'
import Side from '@/components/layouts/AuthLayout/Side'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const SignInDemoSplit = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSignIn = async ({ values, setSubmitting, setMessage }) => {
        setIsLoading(true)
        setSubmitting(true)

        try {
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            })

            if (result?.error) {
                setMessage('Credenciais inválidas')
                toast.push(
                    <Notification type="danger">Credenciais inválidas</Notification>,
                    { placement: 'top-center' }
                )
            } else if (result?.ok) {
                toast.push(
                    <Notification type="success">Login realizado com sucesso!</Notification>,
                    { placement: 'top-center' }
                )
                router.push('/dashboards/project')
            }
        } catch (error) {
            console.error('Sign in error:', error)
            setMessage('Erro interno do servidor')
            toast.push(
                <Notification type="danger">Erro interno do servidor</Notification>,
                { placement: 'top-center' }
            )
        } finally {
            setIsLoading(false)
            setSubmitting(false)
        }
    }

    const handleOAuthSignIn = async ({ type }) => {
        // OAuth temporarily disabled to avoid client issues
        toast.push(
            <Notification type="warning">OAuth login temporariamente desabilitado</Notification>,
            { placement: 'top-center' }
        )
    }

    return (
        <Side>
            <SignIn
                signUpUrl="/auth/sign-up-side"
                forgetPasswordUrl="/auth/forgot-password-side"
                onSubmit={handleSignIn}
                onOAuthSignIn={handleOAuthSignIn}
                loading={isLoading}
            />
        </Side>
    )
}

export default SignInDemoSplit

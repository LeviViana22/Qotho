'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children, initialSession }) {
    // HARDCODED ADMIN USER - BYPASS ALL AUTHENTICATION
    const hardcodedUser = {
        id: 'cmg1gqz210003tuzgj56jowf8',
        userId: 'cmg1gqz210003tuzgj56jowf8',
        userName: 'Levi Viana',
        name: 'Levi Viana',
        email: 'levivianna_22@hotmail.com',
        role: 'ADMIN',
        status: 'active',
        authority: ['ADMIN', 'admin', 'user', 'USER'], // Full access to everything
        avatar: '',
        firstName: 'Levi',
        lastName: 'Viana',
        title: 'Administrator',
        personalInfo: {},
        lastOnline: Date.now(),
        img: ''
    }
    
    const [user, setUser] = useState(hardcodedUser) // Always set to hardcoded user
    const [loading, setLoading] = useState(false)

    const login = async (email, password) => {
        setLoading(true)
        try {
            // HARDCODED LOGIN - ALWAYS SUCCESS
            console.log('HARDCODED LOGIN: Always returning success for Levi Viana')
            setUser(hardcodedUser)
            return { success: true, user: hardcodedUser }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Network error' }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            })
            setUser(null)
            return { success: true }
        } catch (error) {
            console.error('Logout error:', error)
            return { success: false, error: 'Network error' }
        } finally {
            setLoading(false)
        }
    }

    const getSession = async () => {
        try {
            // HARDCODED SESSION - ALWAYS RETURN ADMIN USER
            console.log('HARDCODED SESSION: Always returning Levi Viana')
            setUser(hardcodedUser)
            return hardcodedUser
        } catch (error) {
            console.error('Session error:', error)
            setUser(hardcodedUser) // Even on error, return hardcoded user
            return hardcodedUser
        }
    }

    useEffect(() => {
        // HARDCODED SESSION - ALWAYS SET ADMIN USER ON MOUNT
        console.log('HARDCODED AUTH: Setting Levi Viana as logged in user')
        setUser(hardcodedUser)
    }, [])

    const value = {
        user,
        login,
        logout,
        getSession,
        loading,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}


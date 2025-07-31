'use server'

import { cookies } from 'next/headers'
import appConfig from '@/configs/app.config'
import { COOKIES_KEY } from '@/constants/app.constant'

const COOKIE_NAME = COOKIES_KEY.LOCALE

// Supported locales
const SUPPORTED_LOCALES = ['en', 'pt']

export async function getLocale() {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get(COOKIE_NAME)?.value
    
    // Validate that the locale is supported, fall back to default if not
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
        return cookieLocale
    }
    
    return appConfig.locale
}

export async function setLocale(locale) {
    // Only set supported locales
    if (SUPPORTED_LOCALES.includes(locale)) {
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, locale)
    }
}

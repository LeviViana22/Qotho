'use client'
import { useRegistroCivilAccess } from '../_hooks/useRegistroCivilAccess'
import Loading from '@/components/shared/Loading'

const RegistroCivilAccessControl = ({ children }) => {
    const { hasAccess, isLoading } = useRegistroCivilAccess()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loading />
            </div>
        )
    }

    if (hasAccess === false) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Acesso Negado
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Você não tem permissão para acessar o Registro Civil.
                    </p>
                </div>
            </div>
        )
    }

    return children
}

export default RegistroCivilAccessControl


'use client'
import { useScrumBoardAccess } from '../_hooks/useScrumBoardAccess'
import Loading from '@/components/shared/Loading'

const ScrumBoardAccessControl = ({ children }) => {
    const { hasAccess, isLoading } = useScrumBoardAccess()

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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Acesso Negado
                    </h2>
                    <p className="text-gray-600">
                        Você não tem acesso ao quadro Scrum. Entre em contato com o administrador.
                    </p>
                </div>
            </div>
        )
    }

    return children
}

export default ScrumBoardAccessControl

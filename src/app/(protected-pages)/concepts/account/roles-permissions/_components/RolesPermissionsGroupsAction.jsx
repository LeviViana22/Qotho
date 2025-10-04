'use client'

import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { useRouter } from 'next/navigation'

const RolesPermissionsGroupsAction = () => {
    const { setRoleDialog } = useRolePermissionsStore()
    const router = useRouter()

    const handleAddUser = () => {
        router.push('/concepts/account/add-user')
    }

    return (
        <div className="flex gap-2">
            <Button
                variant="solid"
                onClick={handleAddUser}
            >
                Adicionar usuário
            </Button>
            <Button
                variant="solid"
                onClick={() =>
                    setRoleDialog({
                        type: 'new',
                        open: true,
                    })
                }
            >
                Criar função
            </Button>
        </div>
    )
}

export default RolesPermissionsGroupsAction

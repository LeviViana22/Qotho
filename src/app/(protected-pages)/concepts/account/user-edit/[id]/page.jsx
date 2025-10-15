import UserEdit from './_components/UserEdit'
import PermissionSwitcher from '@/components/shared/PermissionSwitcher'
import ClientAccessControl from '@/components/shared/ClientAccessControl'

const Page = async ({ params }) => {
    const { id } = await params
    return (
        <ClientAccessControl requiredModule="users">
            <div>
                <div className="mb-6">
                    <PermissionSwitcher 
                        module="users"
                        label="Editar usuários"
                    />
                </div>
                <UserEdit userId={id} />
            </div>
        </ClientAccessControl>
    )
}

export default Page

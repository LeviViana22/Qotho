import AddUser from './_components/AddUser'
import PermissionSwitcher from '@/components/shared/PermissionSwitcher'
import ClientAccessControl from '@/components/shared/ClientAccessControl'

const Page = async () => {
    return (
        <ClientAccessControl requiredModule="users">
            <div>
                <div className="mb-6">
                    <PermissionSwitcher 
                        module="users"
                        label="Criar usuários"
                    />
                </div>
                <AddUser />
            </div>
        </ClientAccessControl>
    )
}

export default Page


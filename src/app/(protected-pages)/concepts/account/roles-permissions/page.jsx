import Container from '@/components/shared/Container'
import RolesPermissionsGroups from './_components/RolesPermissionsGroups'
import RolesPermissionsGroupsAction from './_components/RolesPermissionsGroupsAction'
import RolesPermissionsUserAction from './_components/RolesPermissionsUserAction'
import RolesPermissionsUserTable from './_components/RolesPermissionsUserTable'
import RolesPermissionsUserSelected from './_components/RolesPermissionsUserSelected'
import RolesPermissionsAccessDialog from './_components/RolesPermissionsAccessDialog'
import RolesPermissionsProvider from './_components/RolesPermissionsProvider'
import PermissionSwitcher from '@/components/shared/PermissionSwitcher'
import ClientAccessControl from '@/components/shared/ClientAccessControl'
import getRolesPermissionsRoles from '@/server/actions/getRolesPermissionsRoles'
import { getAllUsers } from '@/lib/user'

export default async function Page({ searchParams }) {
    const params = await searchParams

    const roleList = await getRolesPermissionsRoles()
    
    // Get users from database
    const users = await getAllUsers()
    
    // Map image field to img for frontend compatibility
    const mappedUsers = users.map(user => {
        const { password, ...safeUser } = user
        return {
            ...safeUser,
            img: safeUser.image || '', // Map image to img for frontend
        }
    })
    
    const userList = {
        list: mappedUsers,
        total: mappedUsers.length
    }

    return (
        <ClientAccessControl requiredModule="users">
            <RolesPermissionsProvider
                roleList={roleList}
                userList={userList.list}
                role={params.role}
                status={params.status}
            >
                <Container>
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3>Funções e permissões</h3>
                            <RolesPermissionsGroupsAction />
                        </div>
                        <div className="mb-4">
                            <PermissionSwitcher 
                                module="users"
                                label="Gestão de usuários"
                            />
                        </div>
                        <div className="mb-10">
                            <RolesPermissionsGroups />
                        </div>
                    </div>
                    <div>
                        <div>
                            <div className="mb-6 flex flex-col gap-5">
                                <h3>Todos os usuários</h3>
                                <div className="flex-1">
                                    <RolesPermissionsUserAction />
                                </div>
                            </div>
                            <RolesPermissionsUserTable
                                userListTotal={userList.total}
                                pageIndex={parseInt(params.pageIndex) || 1}
                                pageSize={parseInt(params.pageSize) || 10}
                            />
                        </div>
                    </div>
                </Container>
                <RolesPermissionsAccessDialog />
                <RolesPermissionsUserSelected />
            </RolesPermissionsProvider>
        </ClientAccessControl>
    )
}

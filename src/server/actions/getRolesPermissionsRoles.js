import { getAllUsers } from '@/lib/user'

const getRolesPermissionsRoles = async () => {
    // Get real users from database
    const users = await getAllUsers()
    
    // Map image field to img for frontend compatibility
    const mappedUsers = users.map(user => {
        const { password, ...safeUser } = user
        return {
            ...safeUser,
            img: safeUser.image || '', // Map image to img for frontend
        }
    })

    // Define role groups based on actual roles in the system
    const roleGroups = [
        {
            id: 'admin',
            name: 'Administrador',
            description: 'Acesso total a todas as funcionalidades e configurações. Pode gerenciar usuários, funções e configurações.',
            users: mappedUsers.filter((user) => user.role === 'admin'),
            accessRight: {
                users: ['write', 'read', 'delete'],
                products: ['write', 'read', 'delete'],
                configurations: ['write', 'read', 'delete'],
                files: ['write', 'read', 'delete'],
                reports: ['write', 'read', 'delete'],
            },
        },
        {
            id: 'user',
            name: 'Usuário',
            description: 'Acesso a funcionalidades básicas necessárias para tarefas. Privilégios administrativos limitados.',
            users: mappedUsers.filter((user) => user.role === 'user'),
            accessRight: {
                users: ['read'],
                products: ['write', 'read'],
                configurations: ['read'],
                files: ['write', 'read'],
                reports: ['read'],
            },
        },
    ]

    return roleGroups
}

export default getRolesPermissionsRoles

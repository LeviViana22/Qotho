export const ADMIN = 'admin'
export const ADMIN_UPPER = 'ADMIN' // HARDCODED BYPASS - Support uppercase ADMIN
export const SUPERVISOR = 'supervisor'
export const SUPPORT = 'support'
export const USER = 'user'
export const AUDITOR = 'auditor'
export const GUEST = 'guest'

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
    [ADMIN]: 6,
    [ADMIN_UPPER]: 6, // HARDCODED BYPASS - Same level as admin
    [SUPERVISOR]: 5,
    [SUPPORT]: 4,
    [AUDITOR]: 3,
    [USER]: 2,
    [GUEST]: 1,
}

// Page access permissions for each role
export const ROLE_PAGE_PERMISSIONS = {
    [ADMIN]: {
        // Admin has access to all pages
        pages: ['*'], // Wildcard means all pages
        description: 'Acesso total a todas as funcionalidades e configurações'
    },
    [ADMIN_UPPER]: {
        // HARDCODED BYPASS - Uppercase ADMIN has same access as admin
        pages: ['*'], // Wildcard means all pages
        description: 'Acesso total a todas as funcionalidades e configurações'
    },
    [SUPERVISOR]: {
        pages: [
            'dashboards',
            'concepts/account/settings',
            'concepts/account/roles-permissions',
            'ui-components',
            'guide'
        ],
        description: 'Supervisa operações e usuários. Pode visualizar relatórios e tem acesso limitado a configurações'
    },
    [SUPPORT]: {
        pages: [
            'dashboards',
            'concepts/account/settings',
            'ui-components',
            'guide'
        ],
        description: 'Fornece assistência técnica. Pode acessar contas de usuários e relatórios do sistema para diagnósticos'
    },
    [AUDITOR]: {
        pages: [
            'dashboards',
            'concepts/account/settings',
            'ui-components'
        ],
        description: 'Acesso somente leitura para auditoria e relatórios'
    },
    [USER]: {
        pages: [
            'dashboards',
            'concepts/account/settings'
        ],
        description: 'Acesso a funcionalidades básicas necessárias para tarefas'
    },
    [GUEST]: {
        pages: [
            'dashboards'
        ],
        description: 'Acesso limitado apenas ao dashboard principal'
    }
}

// All available roles
export const ALL_ROLES = [
    ADMIN,
    SUPERVISOR,
    SUPPORT,
    AUDITOR,
    USER,
    GUEST
]

// Role labels for UI
export const ROLE_LABELS = {
    [ADMIN]: 'Administrador',
    [ADMIN_UPPER]: 'Administrador', // HARDCODED BYPASS - Same label as admin
    [SUPERVISOR]: 'Supervisor',
    [SUPPORT]: 'Suporte',
    [AUDITOR]: 'Auditor',
    [USER]: 'Usuário',
    [GUEST]: 'Convidado'
}

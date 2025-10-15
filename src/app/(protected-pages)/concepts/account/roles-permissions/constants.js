export const accessModules = [
    {
        id: 'users',
        name: 'Gestão de usuários',
        description: 'Acessar e editar usuários',
        accessor: [
            {
                label: 'Acesso completo',
                value: 'edit',
            },
        ],
    },
    {
        id: 'products',
        name: 'Autoridade de produtos',
        description: 'Acessar, editar e excluir produtos',
        accessor: [
            {
                label: 'Ler',
                value: 'read',
            },
            {
                label: 'Escrever',
                value: 'write',
            },
            {
                label: 'Excluir',
                value: 'delete',
            },
        ],
    },
    {
        id: 'configurations',
        name: 'Configurações do sistema',
        description: 'Acessar, editar e excluir configurações do sistema',
        accessor: [
            {
                label: 'Ler',
                value: 'read',
            },
            {
                label: 'Escrever',
                value: 'write',
            },
            {
                label: 'Excluir',
                value: 'delete',
            },
        ],
    },
    {
        id: 'files',
        name: 'Gestão de arquivos',
        description: 'Acessar, editar e excluir arquivos',
        accessor: [
            {
                label: 'Ler',
                value: 'read',
            },
            {
                label: 'Escrever',
                value: 'write',
            },
            {
                label: 'Excluir',
                value: 'delete',
            },
        ],
    },
    {
        id: 'reports',
        name: 'Relatórios',
        description: 'Acessar, editar e excluir relatórios',
        accessor: [
            {
                label: 'Ler',
                value: 'read',
            },
            {
                label: 'Escrever',
                value: 'write',
            },
            {
                label: 'Excluir',
                value: 'delete',
            },
        ],
    },
]

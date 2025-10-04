# Registro Civil - Kanban Board

This is an exact copy of the Escrituras kanban board, created as a separate, independent system for managing civil registry workflows.

## Features

- **Independent Data Storage**: All data is stored separately from the Escrituras board
- **Dynamic Boards**: Create, rename, and delete boards with custom colors
- **Dynamic Fields**: Configure custom fields for projects
- **Project Management**: Create, edit, and manage projects with drag-and-drop functionality
- **User Management**: Control access with member management
- **Real-time Updates**: Changes are saved to the database immediately

## File Structure

```
registro-civil/
├── page.jsx                           # Main page component
├── _components/                       # UI components
│   ├── Board.jsx                      # Main board component
│   ├── BoardCard.jsx                  # Individual project cards
│   ├── BoardCardList.jsx              # List of cards in a column
│   ├── BoardColumn.jsx                # Board column component
│   ├── BoardTitle.jsx                 # Column header with actions
│   ├── BoardColorPicker.jsx           # Color picker for boards
│   ├── TrashCan.jsx                   # Drag-to-delete functionality
│   ├── RegistroCivilHeader.jsx        # Main header component
│   ├── RegistroCivilProvider.jsx      # Data provider component
│   ├── RegistroCivilAccessControl.jsx # Access control wrapper
│   ├── AddNewColumnContent.jsx        # Add new board dialog
│   ├── AddNewTicketContent.jsx        # Add new project dialog
│   ├── AddNewMemberContent.jsx        # Add members dialog
│   ├── TicketContent.jsx              # Project details dialog
│   └── ProjectDetailsDrawer.jsx       # Project details drawer
├── _store/                            # State management
│   ├── registroCivilStore.js          # Main Zustand store
│   └── fieldConfigStore.js            # Field configuration store
├── _hooks/                            # Custom hooks
│   ├── useRegistroCivilUsers.js       # User management hook
│   └── useRegistroCivilAccess.js      # Access control hook
├── _contexts/                         # React contexts
│   └── BoardColorsContext.jsx         # Board colors context
├── utils/                             # Utility functions
│   ├── boardColors.js                 # Board color utilities
│   └── utils.js                       # General utilities
└── README.md                          # This file
```

## API Endpoints

### Projects
- `GET /api/projects/registro-civil` - Get all projects
- `POST /api/projects/registro-civil/create` - Create new project
- `GET /api/projects/registro-civil/[id]` - Get specific project
- `PUT /api/projects/registro-civil/[id]` - Update project
- `DELETE /api/projects/registro-civil/[id]` - Delete project

### Boards
- `POST /api/projects/registro-civil/add-board` - Create new board
- `PUT /api/projects/registro-civil/rename-board` - Rename board
- `PUT /api/projects/registro-civil/reorder-boards` - Reorder boards

### Members
- `GET /api/registro-civil/members` - Get board members
- `PUT /api/registro-civil/members` - Update board members

### Board Colors
- `GET /api/board-colors/registro-civil` - Get board colors
- `POST /api/board-colors/registro-civil` - Save board color
- `PUT /api/board-colors/registro-civil` - Update board color

### Field Configuration
- `GET /api/field-configs/registro-civil` - Get field configs
- `POST /api/field-configs/registro-civil` - Create field config
- `PUT /api/field-configs/registro-civil/[id]` - Update field config
- `DELETE /api/field-configs/registro-civil/[id]` - Delete field config
- `PUT /api/field-configs/registro-civil/reorder` - Reorder fields

## Database Schema

The system uses the existing database tables with a `projectType` field set to `'registro-civil'` to separate data from the Escrituras board:

- `Project` table with `projectType = 'registro-civil'`
- `ScrumBoardMember` table with `projectType = 'registro-civil'`
- `BoardColor` table with `projectType = 'registro-civil'`
- `FieldConfig` table with `projectType = 'registro-civil'`

## Usage

1. Navigate to `/concepts/projects/registro-civil`
2. Create boards for different workflow stages
3. Add projects to boards
4. Configure custom fields in the settings
5. Manage team members and access control
6. Drag and drop projects between boards to update status

## Differences from Escrituras

- All API endpoints use `/registro-civil/` prefix
- All database records have `projectType = 'registro-civil'`
- Project IDs use `RC-` prefix instead of `PJ-`
- Completely separate data storage and state management
- Independent field configurations and board colors


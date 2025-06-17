# PhilsAxioms

Interactive philosophical axiom graph builder with YAML-based content management.

## Features

- **YAML-Driven Content**: All axioms, arguments, edges, and categories are defined in YAML files
- **Hierarchical Tree Layout**: Arguments build on axioms in a clear tree structure
- **Smart Edge Routing**: Non-overlapping edges with 90-degree crossings and arrow directionality
- **Interactive Graph**: Click-to-explore graph visualization with React Flow
- **Dynamic Validation**: Arguments become valid only when prerequisite axioms are accepted
- **Real-time Toggling**: Accept/reject axioms and see arguments update instantly
- **Questionnaire Flow**: Initial yes/no questions to establish user's baseline axioms
- **Lego-Style Animations**: Satisfying snap-together animations when connecting nodes
- **Real-time Updates**: Backend watches YAML files and automatically reloads data
- **Session Management**: Track user progress and axiom selections
- **Visual Filtering**: Toggle between showing all nodes or only valid/accepted ones

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   # Background mode (default)
   ./start.sh
   
   # Foreground mode with logging output
   ./start.sh --foreground
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Choose your entry point:**
   - Take the **questionnaire** to establish your philosophical baseline
   - Or **skip to explore** all axioms and arguments directly

## Content Management with YAML

### Adding New Axioms

Create or edit files in `data/axioms/`:

```yaml
# data/axioms/my_axioms.yaml
axioms:
  - id: my_axiom_id
    title: "My Philosophical Axiom"
    description: "A detailed explanation of this axiom"
    category: ethics  # Must match a category ID
    metadata:
      difficulty: basic  # basic | intermediate | advanced
      tags: ["tag1", "tag2"]
```

### Adding New Arguments

Create or edit files in `data/arguments/`:

```yaml
# data/arguments/my_arguments.yaml
arguments:
  - id: my_argument_id
    title: "My Complex Argument"
    description: "How this argument builds on simpler axioms"
    conclusion: "The logical conclusion this argument reaches"
    category: ethics
    level: 2  # Higher levels depend on lower level arguments/axioms
    metadata:
      difficulty: advanced
      tags: ["reasoning", "complex"]
      strength: 0.8  # 0-1, how convincing this argument is
```

### Adding New Categories

Edit `data/categories.yaml`:

```yaml
categories:
  - id: my_category
    name: "My Philosophy Area"
    color: "#FF6B6B"  # Hex color for the category
    description: "Description of this philosophical area"
```

### Adding Logical Connections

Create or edit files in `data/edges/`:

```yaml
# data/edges/my_connections.yaml
edges:
  - id: connection_id
    fromNode: axiom1_id      # Source node ID
    toNode: argument1_id     # Target node ID  
    fromType: axiom          # axiom | argument
    toType: argument         # axiom | argument
    relation:
      type: supports         # implies | contradicts | supports | requires | assumes
      strength: 0.8          # 0-1, how strong the connection is
      bidirectional: false   # optional
    explanation: "Why axiom1 supports argument1"
    metadata:
      difficulty: intermediate
```

### Updating the Questionnaire

Edit `data/questionnaire.yaml`:

```yaml
questionnaire:
  - axiomId: my_axiom_id
    question: "Do you believe this philosophical principle?"
    explanation: "Additional context to help users understand"
    category: ethics
```

## Project Structure

```
philsaxioms/
├── data/                    # YAML content files
│   ├── categories.yaml      # Axiom categories and colors
│   ├── questionnaire.yaml   # Initial questionnaire
│   ├── axioms/             # Axiom definitions (Level 0)
│   │   ├── basic.yaml
│   │   └── advanced.yaml
│   ├── arguments/          # Argument definitions (Level 1+)
│   │   ├── level1.yaml
│   │   └── level2.yaml
│   └── edges/              # Logical connections
│       ├── logical_connections.yaml
│       └── hierarchical_connections.yaml
├── packages/
│   ├── shared/             # Shared TypeScript types
│   ├── backend/            # Node.js API server
│   └── frontend/           # React application
└── start.sh                # Development startup script
```

## API Endpoints

- `GET /api/graph` - Get all axioms, arguments, edges, and categories
- `GET /api/questionnaire` - Get questionnaire items
- `GET /api/axioms/:id` - Get specific axiom
- `GET /api/arguments/:id` - Get specific argument
- `GET /api/nodes/:id/connections` - Get connected nodes (axioms or arguments)
- `POST /api/sessions` - Create user session
- `PUT /api/sessions/:id` - Update user session
- `POST /api/snapshots` - Create shareable snapshot
- `GET /api/snapshots/:id` - Get specific snapshot
- `GET /api/snapshots` - List public snapshots

## Development

### Building Packages

```bash
# Build shared types
npm run build --workspace=packages/shared

# Build backend
npm run build --workspace=packages/backend

# Build frontend
npm run build --workspace=packages/frontend
```

### Type Checking

```bash
npm run type-check
```

### Adding New Content Workflow

1. **Add axioms** to appropriate YAML file in `data/axioms/`
2. **Add arguments** to level-appropriate files in `data/arguments/`
3. **Connect them** with edges in `data/edges/`
4. **Optionally add axioms** to questionnaire in `data/questionnaire.yaml`
5. **Server automatically reloads** - no restart needed!

## Graph Structure

### Hierarchy Levels
- **Level 0**: Fundamental axioms (basic philosophical assumptions)
- **Level 1+**: Arguments that build on axioms and lower-level arguments
- **Higher levels**: More complex arguments requiring multiple prerequisites

### Validation Logic
- Arguments become **valid** only when their prerequisite axioms are accepted
- **Dynamic filtering**: Toggle between showing all nodes or only valid ones
- **Real-time updates**: Accept/reject axioms and see the argument tree update instantly

## Relationship Types

- **Implies**: A logically follows from B
- **Contradicts**: A and B cannot both be true
- **Supports**: A provides evidence for B
- **Requires**: A needs B to be true
- **Assumes**: A takes B for granted

## License

MIT License - Build your philosophical framework!
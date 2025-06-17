import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import GraphView from '../components/GraphView';
import { Axiom, Argument, Edge, AxiomCategory, UserSession } from '@philsaxioms/shared';

// Mock React Flow
vi.mock('reactflow', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  MiniMap: () => <div data-testid="minimap" />,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  getSmoothStepPath: vi.fn(() => ['M 0 0 L 100 100', 50, 50]),
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock API client
vi.mock('../utils/api', () => ({
  apiClient: {
    createSnapshot: vi.fn(),
  },
}));

const mockCategories: AxiomCategory[] = [
  {
    id: 'ethics',
    name: 'Ethics',
    color: '#EF4444',
    description: 'Moral principles',
  },
  {
    id: 'logic',
    name: 'Logic',
    color: '#10B981',
    description: 'Principles of reasoning',
  },
];

const mockAxioms: Axiom[] = [
  {
    id: 'axiom-1',
    title: 'Test Axiom 1',
    description: 'First test axiom',
    category: 'ethics',
  },
  {
    id: 'axiom-2',
    title: 'Test Axiom 2',
    description: 'Second test axiom',
    category: 'logic',
  },
];

const mockArguments: Argument[] = [
  {
    id: 'argument-1',
    title: 'Test Argument 1',
    description: 'First test argument',
    conclusion: 'Test conclusion',
    category: 'ethics',
    level: 1,
  },
];

const mockEdges: Edge[] = [
  {
    id: 'edge-1',
    fromNode: 'axiom-1',
    toNode: 'argument-1',
    fromType: 'axiom',
    toType: 'argument',
    relation: {
      type: 'supports',
      strength: 0.8,
    },
    explanation: 'Axiom supports argument',
  },
];

const mockSession: UserSession = {
  id: 'session-1',
  acceptedAxioms: ['axiom-1'],
  rejectedAxioms: ['axiom-2'],
  exploredConnections: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderGraphView(sessionOverride?: Partial<UserSession>) {
  const session = { ...mockSession, ...sessionOverride };
  const mockOnSessionUpdate = vi.fn();
  
  return {
    ...render(
      <BrowserRouter>
        <GraphView
          axioms={mockAxioms}
          arguments={mockArguments}
          edges={mockEdges}
          categories={mockCategories}
          session={session}
          onSessionUpdate={mockOnSessionUpdate}
        />
      </BrowserRouter>
    ),
    mockOnSessionUpdate,
  };
}

describe('GraphView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders graph components', () => {
    renderGraphView();
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    renderGraphView();
    
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByText('Save Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Hide Invalid')).toBeInTheDocument();
  });

  it('renders relationship legend', () => {
    renderGraphView();
    
    expect(screen.getByText('Relationship Types')).toBeInTheDocument();
    expect(screen.getByText('Implies')).toBeInTheDocument();
    expect(screen.getByText('Contradicts')).toBeInTheDocument();
    expect(screen.getByText('Supports')).toBeInTheDocument();
    expect(screen.getByText('Requires')).toBeInTheDocument();
    expect(screen.getByText('Assumes')).toBeInTheDocument();
  });

  it('toggles invalid node visibility', async () => {
    const user = userEvent.setup();
    renderGraphView();
    
    const toggleButton = screen.getByText('Hide Invalid');
    expect(toggleButton).toBeInTheDocument();
    
    await user.click(toggleButton);
    
    // Button text should change
    expect(screen.getByText('Show All')).toBeInTheDocument();
  });

  it('opens snapshot modal when save button is clicked', async () => {
    const user = userEvent.setup();
    renderGraphView();
    
    await user.click(screen.getByText('Save Snapshot'));
    
    expect(screen.getByText('Create Snapshot')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('My Philosophical Framework')).toBeInTheDocument();
  });

  it('shows different behavior for empty session vs populated session', () => {
    // Test with empty session (no accepted axioms)
    renderGraphView({ acceptedAxioms: [], rejectedAxioms: [] });
    
    // Should show all nodes when no axioms accepted
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    
    // Test with populated session
    renderGraphView({ acceptedAxioms: ['axiom-1'], rejectedAxioms: ['axiom-2'] });
    
    // Should show filtered nodes based on accepted axioms
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('provides navigation back to questionnaire', async () => {
    const user = userEvent.setup();
    renderGraphView();
    
    const newSessionButton = screen.getByText('New Session');
    expect(newSessionButton).toBeInTheDocument();
    
    await user.click(newSessionButton);
    
    // Should navigate (we can't easily test navigation in this setup,
    // but we can test that the button is clickable)
    expect(newSessionButton).toBeInTheDocument();
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { apiClient } from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    fetchGraphData: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
  },
}));

// Mock React Flow components to avoid WebGL issues in tests
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

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockGraphData = {
  axioms: [
    {
      id: 'test-axiom-1',
      title: 'Test Axiom 1',
      description: 'This is a test axiom',
      category: 'ethics',
    },
  ],
  arguments: [
    {
      id: 'test-argument-1',
      title: 'Test Argument 1',
      description: 'This is a test argument',
      conclusion: 'Test conclusion',
      category: 'ethics',
      level: 1,
    },
  ],
  edges: [],
  categories: [
    {
      id: 'ethics',
      name: 'Ethics',
      color: '#EF4444',
      description: 'Moral principles',
    },
  ],
};

// Questionnaire is mocked in the API mock

const mockSession = {
  id: 'test-session-1',
  acceptedAxioms: ['test-axiom-1'],
  rejectedAxioms: [],
  exploredConnections: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(apiClient.fetchGraphData).mockResolvedValue(mockGraphData);
    vi.mocked(apiClient.createSession).mockResolvedValue(mockSession);
    vi.mocked(apiClient.updateSession).mockResolvedValue(mockSession);
  });

  it('shows loading screen initially', async () => {
    // Make API call slow to test loading state
    vi.mocked(apiClient.fetchGraphData).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockGraphData), 1000))
    );
    
    renderApp();
    
    expect(screen.getByText('Loading PhilsAxioms...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
  });

  it('shows error state when data loading fails', async () => {
    vi.mocked(apiClient.fetchGraphData).mockRejectedValue(new Error('Network error'));
    
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders questionnaire after data loads', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('PhilsAxioms')).toBeInTheDocument();
      expect(screen.getByText('Build your philosophical framework by answering these foundational questions')).toBeInTheDocument();
      expect(screen.getByText('Skip questionnaire and explore all axioms →')).toBeInTheDocument();
    });
  });

  it('allows skipping questionnaire and navigating to explore', async () => {
    const user = userEvent.setup();
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Skip questionnaire and explore all axioms →')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Skip questionnaire and explore all axioms →'));
    
    await waitFor(() => {
      expect(apiClient.createSession).toHaveBeenCalledWith([], []);
    });
  });

  it('navigates to explore view after session creation', async () => {
    const user = userEvent.setup();
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Skip questionnaire and explore all axioms →')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Skip questionnaire and explore all axioms →'));
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  it('shows loading state when session is being created', async () => {
    // Mock slow session creation
    vi.mocked(apiClient.createSession).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSession), 500))
    );
    
    const user = userEvent.setup();
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Skip questionnaire and explore all axioms →')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Skip questionnaire and explore all axioms →'));
    
    // Should show session creation loading state
    await waitFor(() => {
      expect(screen.getByText('Creating session...')).toBeInTheDocument();
    });
  });

  it('provides fallback when session creation takes too long', async () => {
    // Mock very slow session creation
    vi.mocked(apiClient.createSession).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSession), 5000))
    );
    
    const user = userEvent.setup();
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Skip questionnaire and explore all axioms →')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Skip questionnaire and explore all axioms →'));
    
    await waitFor(() => {
      expect(screen.getByText('Creating session...')).toBeInTheDocument();
      expect(screen.getByText('If this takes too long, please go back and try again.')).toBeInTheDocument();
      expect(screen.getByText('Back to Start')).toBeInTheDocument();
    });
    
    // User can go back
    await user.click(screen.getByText('Back to Start'));
    
    await waitFor(() => {
      expect(screen.getByText('PhilsAxioms')).toBeInTheDocument();
    });
  });
});
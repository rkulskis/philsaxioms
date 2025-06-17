import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AxiomNode from '../components/AxiomNode';
import ArgumentNode from '../components/ArgumentNode';
import Questionnaire from '../components/Questionnaire';
import { Axiom, Argument, AxiomCategory } from '@philsaxioms/shared';

// Mock framer-motion for snapshots
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock React Flow components
vi.mock('reactflow', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

// Mock API for questionnaire
vi.mock('../utils/api', () => ({
  apiClient: {
    fetchQuestionnaire: vi.fn().mockResolvedValue([
      {
        axiomId: 'reality_exists',
        question: 'Do you believe there is an objective reality?',
        explanation: 'This is about whether reality exists independently',
        category: 'metaphysics',
      },
    ]),
  },
}));

const mockCategory: AxiomCategory = {
  id: 'ethics',
  name: 'Ethics',
  color: '#EF4444',
  description: 'Moral principles and values',
};

const mockAxiom: Axiom = {
  id: 'test-axiom',
  title: 'Test Axiom',
  description: 'This is a test axiom for snapshot testing',
  category: 'ethics',
  metadata: {
    difficulty: 'basic',
    tags: ['test', 'philosophy'],
  },
};

const mockArgument: Argument = {
  id: 'test-argument',
  title: 'Test Argument',
  description: 'This is a test argument that builds on axioms',
  conclusion: 'Therefore, this conclusion follows logically',
  category: 'ethics',
  level: 1,
  metadata: {
    difficulty: 'intermediate',
    tags: ['reasoning', 'logic'],
    strength: 0.8,
  },
};

describe('Component Snapshots', () => {
  it('renders AxiomNode in default state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <AxiomNode
        data={{
          axiom: mockAxiom,
          category: mockCategory,
          isSelected: false,
          isAccepted: false,
          isRejected: false,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders AxiomNode in accepted state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <AxiomNode
        data={{
          axiom: mockAxiom,
          category: mockCategory,
          isSelected: false,
          isAccepted: true,
          isRejected: false,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders AxiomNode in rejected state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <AxiomNode
        data={{
          axiom: mockAxiom,
          category: mockCategory,
          isSelected: false,
          isAccepted: false,
          isRejected: true,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders AxiomNode in selected state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <AxiomNode
        data={{
          axiom: mockAxiom,
          category: mockCategory,
          isSelected: true,
          isAccepted: false,
          isRejected: false,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ArgumentNode in valid state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <ArgumentNode
        data={{
          argument: mockArgument,
          category: mockCategory,
          isSelected: false,
          isValid: true,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ArgumentNode in invalid state', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <ArgumentNode
        data={{
          argument: mockArgument,
          category: mockCategory,
          isSelected: false,
          isValid: false,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ArgumentNode for different levels', () => {
    const level2Argument = { ...mockArgument, level: 2, title: 'Level 2 Argument' };
    const mockOnSelect = vi.fn();
    
    const { container } = render(
      <ArgumentNode
        data={{
          argument: level2Argument,
          category: mockCategory,
          isSelected: false,
          isValid: true,
          onSelect: mockOnSelect,
        }}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Questionnaire component', async () => {
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();
    const categories = [mockCategory];
    
    const { container } = render(
      <BrowserRouter>
        <Questionnaire
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
          categories={categories}
        />
      </BrowserRouter>
    );
    
    // Wait for loading to complete and component to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
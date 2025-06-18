export interface AxiomCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface NodeEdge {
  to: string; // ID of the target node
  type: 'supports';
  description: string;
}

export interface BaseNode {
  id: string;
  title: string;
  description: string;
  category: string;
  edges: NodeEdge[];
  position?: {
    x: number;
    y: number;
  };
}

export interface Axiom extends BaseNode {
  type: 'axiom';
}

export interface Argument extends BaseNode {
  type: 'argument';
  conclusion: string;
}

export interface UserSession {
  id: string;
  acceptedAxioms: string[];
  rejectedAxioms: string[];
  exploredConnections?: string[];
  currentSnapshot?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Snapshot {
  id: string;
  title: string;
  description?: string;
  axioms: string[];
  edges: string[];
  userPositions?: Record<string, { x: number; y: number }>;
  metadata?: {
    createdBy?: string;
    isPublic?: boolean;
    tags?: string[];
  };
  createdAt: Date;
}

export interface Source {
  id: string;
  name: string;
  period?: string;
  tradition?: string;
  key_works?: string[];
  perspective?: string;
  description?: string;
  key_figures?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  orphanedArguments: string[];
  circularDependencies: string[];
}

export type Node = Axiom | Argument;

export interface GraphData {
  nodes: Node[];
  categories: AxiomCategory[];
}

export interface QuestionnaireItem {
  id: string;
  text: string;
  axiomId: string;
  category: string;
}
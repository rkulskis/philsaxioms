export interface AxiomCategory {
    id: string;
    name: string;
    color: string;
    description?: string;
}
export interface ActivationConditions {
    required_axioms?: string[];
    forbidden_axioms?: string[];
    required_arguments?: string[];
    forbidden_arguments?: string[];
}
export interface Axiom {
    id: string;
    title: string;
    description: string;
    category: string;
    position?: {
        x: number;
        y: number;
    };
    metadata?: {
        difficulty?: 'basic' | 'intermediate' | 'advanced';
        source?: string;
        attribution?: string[];
        tags?: string[];
        acceptability?: number;
    };
}
export interface Argument {
    id: string;
    title: string;
    description: string;
    conclusion: string;
    category: string;
    level: number;
    position?: {
        x: number;
        y: number;
    };
    dependencies?: string[];
    activation_conditions?: ActivationConditions;
    metadata?: {
        difficulty?: 'basic' | 'intermediate' | 'advanced';
        source?: string;
        attribution?: string[];
        tags?: string[];
        strength?: number;
        controversy?: number;
    };
}
export interface LogicalRelation {
    type: 'implies' | 'contradicts' | 'supports' | 'requires' | 'assumes';
    strength: number;
    bidirectional?: boolean;
}
export interface Edge {
    id: string;
    fromNode: string;
    toNode: string;
    fromType: 'axiom' | 'argument';
    toType: 'axiom' | 'argument';
    relation: LogicalRelation;
    explanation: string;
    metadata?: {
        difficulty?: 'basic' | 'intermediate' | 'advanced';
        source?: string;
    };
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
    userPositions?: Record<string, {
        x: number;
        y: number;
    }>;
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
export interface GraphData {
    axioms: Axiom[];
    arguments: Argument[];
    edges: Edge[];
    categories: AxiomCategory[];
    sources?: Source[];
    validation?: ValidationResult;
}
export interface QuestionnaireItem {
    axiomId: string;
    question: string;
    explanation?: string;
    category: string;
}
//# sourceMappingURL=types.d.ts.map
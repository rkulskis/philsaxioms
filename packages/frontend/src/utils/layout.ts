import { Axiom, Argument, Edge } from '@philsaxioms/shared';

export interface LayoutNode {
  id: string;
  type: 'axiom' | 'argument';
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateHierarchicalLayout(
  axioms: Axiom[], 
  argumentNodes: Argument[], 
  _edges: Edge[]
): Map<string, LayoutNode> {
  const layout = new Map<string, LayoutNode>();
  
  // Constants for layout - maximized spacing for clear arrow visibility
  const LEVEL_HEIGHT = 500;
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 150;
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_OFFSET = 200;

  // Get max argument level
  const maxLevel = Math.max(...argumentNodes.map(arg => arg.level), 0);
  
  // Group nodes by level
  const nodesByLevel = new Map<number, Array<{id: string, type: 'axiom' | 'argument', item: Axiom | Argument}>>();
  
  // Level 0: Axioms
  nodesByLevel.set(0, axioms.map(axiom => ({ id: axiom.id, type: 'axiom' as const, item: axiom })));
  
  // Higher levels: Arguments
  for (let level = 1; level <= maxLevel; level++) {
    const levelArguments = argumentNodes.filter(arg => arg.level === level);
    nodesByLevel.set(level, levelArguments.map(arg => ({ id: arg.id, type: 'argument' as const, item: arg })));
  }

  // Calculate positions for each level
  for (let level = 0; level <= maxLevel; level++) {
    const nodesAtLevel = nodesByLevel.get(level) || [];
    const totalWidth = nodesAtLevel.length * NODE_WIDTH + (nodesAtLevel.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2;

    nodesAtLevel.forEach((node, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = VERTICAL_OFFSET + (maxLevel - level) * LEVEL_HEIGHT; // Top-down: higher levels at top

      layout.set(node.id, {
        id: node.id,
        type: node.type,
        level,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      });
    });
  }

  return layout;
}

export function calculateOrthogonalEdgePath(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  sourceHandle: 'top' | 'bottom' | 'left' | 'right' = 'top',
  targetHandle: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
): string {
  // Calculate control points for orthogonal routing
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  let sourceOffset = { x: 0, y: 0 };
  let targetOffset = { x: 0, y: 0 };
  
  // Calculate handle offsets
  switch (sourceHandle) {
    case 'top': sourceOffset = { x: 0, y: -10 }; break;
    case 'bottom': sourceOffset = { x: 0, y: 10 }; break;
    case 'left': sourceOffset = { x: -10, y: 0 }; break;
    case 'right': sourceOffset = { x: 10, y: 0 }; break;
  }
  
  switch (targetHandle) {
    case 'top': targetOffset = { x: 0, y: -10 }; break;
    case 'bottom': targetOffset = { x: 0, y: 10 }; break;
    case 'left': targetOffset = { x: -10, y: 0 }; break;
    case 'right': targetOffset = { x: 10, y: 0 }; break;
  }

  const start = {
    x: sourcePos.x + sourceOffset.x,
    y: sourcePos.y + sourceOffset.y
  };
  
  const end = {
    x: targetPos.x + targetOffset.x,
    y: targetPos.y + targetOffset.y
  };

  // For hierarchical layout, use clear upward routing (top of source to bottom of target)
  if (sourceHandle === 'top' && targetHandle === 'bottom') {
    const midY = start.y + (end.y - start.y) * 0.3;
    const offsetX = Math.abs(end.x - start.x) > 50 ? 0 : (end.x > start.x ? 30 : -30);
    return `M ${start.x} ${start.y} L ${start.x + offsetX} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
  }
  
  // For horizontal connections, use orthogonal routing
  if (Math.abs(dx) > Math.abs(dy)) {
    const midX = start.x + dx / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  } else {
    const midY = start.y + dy / 2;
    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
  }
}
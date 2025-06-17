import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Eye, EyeOff, Home } from 'lucide-react';
import { Axiom, Argument, Edge as GraphEdge, AxiomCategory, UserSession } from '@philsaxioms/shared';
import AxiomNode from './AxiomNode';
import ArgumentNode from './ArgumentNode';
import CustomEdge from './CustomEdge';
import { calculateHierarchicalLayout } from '../utils/layout';
import { apiClient } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const nodeTypes = {
  axiom: AxiomNode,
  argument: ArgumentNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface GraphViewProps {
  axioms: Axiom[];
  arguments: Argument[];
  edges: GraphEdge[];
  categories: AxiomCategory[];
  session: UserSession;
  onSessionUpdate: (updates: Partial<UserSession>) => void;
}

function GraphViewInner({ axioms, arguments: argumentNodes, edges, categories, session, onSessionUpdate }: GraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<{node: Axiom | Argument, type: 'axiom' | 'argument'} | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showInvalidNodes, setShowInvalidNodes] = useState(true);
  const navigate = useNavigate();

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  // Calculate which arguments are valid based on accepted axioms/arguments
  const validArguments = useMemo(() => {
    const valid = new Set<string>();
    const acceptedNodes = new Set(session.acceptedAxioms);
    
    // Iteratively add arguments whose prerequisites are met
    let changed = true;
    while (changed) {
      changed = false;
      
      for (const argument of argumentNodes) {
        if (valid.has(argument.id)) continue;
        
        // Find all prerequisite edges for this argument
        const prerequisites = edges.filter(edge => 
          edge.toNode === argument.id && 
          edge.toType === 'argument' && 
          (edge.relation.type === 'supports' || edge.relation.type === 'requires')
        );
        
        // Check if all prerequisites are satisfied
        const allPrerequisitesMet = prerequisites.length === 0 || 
          prerequisites.every(edge => acceptedNodes.has(edge.fromNode) || valid.has(edge.fromNode));
        
        if (allPrerequisitesMet) {
          valid.add(argument.id);
          acceptedNodes.add(argument.id);
          changed = true;
        }
      }
    }
    
    return valid;
  }, [argumentNodes, edges, session.acceptedAxioms]);

  // Calculate hierarchical layout
  const layout = useMemo(() => {
    return calculateHierarchicalLayout(axioms, argumentNodes, edges);
  }, [axioms, argumentNodes, edges]);

  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    // Add axiom nodes
    axioms.forEach(axiom => {
      const category = getCategoryById(axiom.category);
      const isAccepted = session.acceptedAxioms.includes(axiom.id);
      const isRejected = session.rejectedAxioms.includes(axiom.id);
      const layoutNode = layout.get(axiom.id);
      
      if (!showInvalidNodes && !isAccepted) return;
      
      nodes.push({
        id: axiom.id,
        type: 'axiom',
        position: layoutNode ? { x: layoutNode.x, y: layoutNode.y } : { x: 0, y: 0 },
        data: {
          axiom,
          category: category || { id: 'unknown', name: 'Unknown', color: '#gray' },
          isSelected: selectedNode?.node.id === axiom.id,
          isAccepted,
          isRejected,
          onSelect: (axiom: Axiom) => setSelectedNode({ node: axiom, type: 'axiom' }),
        },
      });
    });
    
    // Add argument nodes
    argumentNodes.forEach(argument => {
      const category = getCategoryById(argument.category);
      const isValid = validArguments.has(argument.id);
      const layoutNode = layout.get(argument.id);
      
      if (!showInvalidNodes && !isValid) return;
      
      nodes.push({
        id: argument.id,
        type: 'argument',
        position: layoutNode ? { x: layoutNode.x, y: layoutNode.y } : { x: 0, y: 0 },
        data: {
          argument,
          category: category || { id: 'unknown', name: 'Unknown', color: '#gray' },
          isSelected: selectedNode?.node.id === argument.id,
          isValid,
          onSelect: (argument: Argument) => setSelectedNode({ node: argument, type: 'argument' }),
        },
      });
    });
    
    return nodes;
  }, [axioms, argumentNodes, categories, session, selectedNode, layout, validArguments, showInvalidNodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return edges
      .filter(edge => {
        // Only show edges if both nodes are visible
        const sourceVisible = initialNodes.some(node => node.id === edge.fromNode);
        const targetVisible = initialNodes.some(node => node.id === edge.toNode);
        return sourceVisible && targetVisible;
      })
      .map((edge) => {
        return {
          id: edge.id,
          source: edge.fromNode,
          target: edge.toNode,
          sourceHandle: 'top',
          targetHandle: 'bottom',
          type: 'custom',
          data: {
            relation: edge.relation,
            label: edge.relation.type,
          },
          animated: edge.relation.strength > 0.8,
        };
      });
  }, [edges, initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAxiomToggle = (axiom: Axiom, accept: boolean) => {
    const updates: Partial<UserSession> = {};
    
    if (accept) {
      updates.acceptedAxioms = [...session.acceptedAxioms.filter(id => id !== axiom.id), axiom.id];
      updates.rejectedAxioms = session.rejectedAxioms.filter(id => id !== axiom.id);
    } else {
      updates.rejectedAxioms = [...session.rejectedAxioms.filter(id => id !== axiom.id), axiom.id];
      updates.acceptedAxioms = session.acceptedAxioms.filter(id => id !== axiom.id);
    }
    
    onSessionUpdate(updates);
  };

  // Update nodes when session changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when nodes change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleCreateSnapshot = async () => {
    try {
      const snapshot = await apiClient.createSnapshot(session.id, snapshotTitle, snapshotDescription, isPublic);
      console.log('Snapshot created:', snapshot);
      setShowSnapshotModal(false);
      setSnapshotTitle('');
      setSnapshotDescription('');
      setIsPublic(false);
      
      // Copy link to clipboard
      const url = `${window.location.origin}/snapshot/${snapshot.id}`;
      navigator.clipboard.writeText(url);
      alert(`Snapshot created! Link copied to clipboard: ${url}`);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      alert('Failed to create snapshot');
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        elementsSelectable={true}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          nodeColor={(node) => {
            // Handle both axiom and argument nodes
            const categoryId = node.data.axiom?.category || node.data.argument?.category;
            if (!categoryId) return '#6B7280';
            
            const category = getCategoryById(categoryId);
            return category?.color || '#6B7280';
          }}
        />
      </ReactFlow>

      {/* Sidebar */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-10">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  selectedNode.type === 'axiom' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedNode.type === 'axiom' ? 'Axiom' : `Level ${(selectedNode.node as Argument).level} Argument`}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedNode.node.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {selectedNode.node.description}
              </p>
              
              {selectedNode.type === 'argument' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Conclusion: {(selectedNode.node as Argument).conclusion}
                  </p>
                </div>
              )}
            </div>

            {selectedNode.type === 'axiom' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAxiomToggle(selectedNode.node as Axiom, true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    session.acceptedAxioms.includes(selectedNode.node.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleAxiomToggle(selectedNode.node as Axiom, false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    session.rejectedAxioms.includes(selectedNode.node.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Reject
                </button>
              </div>
            )}

            {selectedNode.type === 'argument' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {validArguments.has(selectedNode.node.id) 
                    ? "✅ This argument is valid based on your accepted axioms"
                    : "❌ This argument requires additional axioms to be accepted"
                  }
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedNode(null)}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          New Session
        </button>
        
        <button
          onClick={() => setShowSnapshotModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Snapshot
        </button>
        
        <button
          onClick={() => setShowInvalidNodes(!showInvalidNodes)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
            showInvalidNodes 
              ? 'bg-gray-500 text-white hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showInvalidNodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showInvalidNodes ? 'Hide Invalid' : 'Show All'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
        <h4 className="font-semibold text-gray-900 mb-3">Relationship Types</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span>Implies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #EF4444 0, #EF4444 3px, transparent 3px, transparent 6px)' }}></div>
            <span>Contradicts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Supports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-500"></div>
            <span>Requires</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #F59E0B 0, #F59E0B 2px, transparent 2px, transparent 4px)' }}></div>
            <span>Assumes</span>
          </div>
        </div>
      </div>

      {/* Snapshot Modal */}
      {showSnapshotModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Snapshot</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Philosophical Framework"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your philosophical viewpoint..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="public" className="text-sm text-gray-700">
                  Make this snapshot public
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateSnapshot}
                disabled={!snapshotTitle.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Snapshot
              </button>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
}

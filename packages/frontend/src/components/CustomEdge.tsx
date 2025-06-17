import { EdgeProps, getStraightPath } from 'reactflow';
import { LogicalRelation } from '@philsaxioms/shared';

interface CustomEdgeData {
  relation: LogicalRelation;
  label: string;
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<CustomEdgeData>) {
  // Use React Flow's straight path for now to ensure visibility
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const getEdgeStyle = (relation: LogicalRelation) => {
    const baseStyle = {
      strokeWidth: Math.max(1, relation.strength * 3),
    };

    switch (relation.type) {
      case 'implies':
        return { ...baseStyle, stroke: '#10B981' };
      case 'contradicts':
        return { ...baseStyle, stroke: '#EF4444', strokeDasharray: '8,4' };
      case 'supports':
        return { ...baseStyle, stroke: '#3B82F6' };
      case 'requires':
        return { ...baseStyle, stroke: '#8B5CF6', strokeWidth: baseStyle.strokeWidth + 1 };
      case 'assumes':
        return { ...baseStyle, stroke: '#F59E0B', strokeDasharray: '4,2' };
      default:
        return { ...baseStyle, stroke: '#6B7280' };
    }
  };

  const style = data?.relation ? getEdgeStyle(data.relation) : { stroke: '#6B7280', strokeWidth: 1 };

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 20 20"
          refX="15"
          refY="10"
          markerWidth="15"
          markerHeight="15"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,20 L20,10 z"
            fill={style.stroke}
            stroke={style.stroke}
            strokeWidth="2"
          />
        </marker>
      </defs>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#arrow-${id})`}
      />
      {data?.label && (
        <foreignObject
          width={120}
          height={30}
          x={labelX - 60}
          y={labelY - 15}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex items-center justify-center h-full">
            <div
              className="px-2 py-1 text-xs font-medium rounded-full text-white shadow-sm"
              style={{ backgroundColor: style.stroke }}
            >
              {data.label}
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
}

import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Axiom, AxiomCategory } from '@philsaxioms/shared';
import clsx from 'clsx';

interface AxiomNodeProps {
  data: {
    axiom: Axiom;
    category: AxiomCategory;
    isSelected: boolean;
    isAccepted: boolean;
    isRejected: boolean;
    onSelect: (axiom: Axiom) => void;
  };
}

export default function AxiomNode({ data }: AxiomNodeProps) {
  const { axiom, category, isSelected, isAccepted, isRejected, onSelect } = data;

  const handleClick = () => {
    onSelect(axiom);
  };

  const snapAnimation = {
    scale: [1, 1.1, 1],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div
      className={clsx(
        'axiom-node',
        'relative p-4 min-w-[200px] max-w-[280px]',
        {
          'border-green-500 bg-green-50': isAccepted,
          'border-red-500 bg-red-50': isRejected,
          'border-gray-300': !isAccepted && !isRejected,
          'ring-4 ring-blue-400 ring-opacity-50': isSelected,
        }
      )}
      style={{
        borderColor: !isAccepted && !isRejected ? category.color : undefined,
      }}
      onClick={handleClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={isSelected ? snapAnimation : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Lego-style connectors */}
      <motion.div 
        className="lego-connector top" 
        style={{ backgroundColor: category.color }}
        whileHover={{ scale: 1.2, y: -2 }}
        transition={{ type: "spring", stiffness: 400 }}
      />
      <motion.div 
        className="lego-connector bottom" 
        style={{ backgroundColor: category.color }}
        whileHover={{ scale: 1.2, y: 2 }}
        transition={{ type: "spring", stiffness: 400 }}
      />
      <motion.div 
        className="lego-connector left" 
        style={{ backgroundColor: category.color }}
        whileHover={{ scale: 1.2, x: -2 }}
        transition={{ type: "spring", stiffness: 400 }}
      />
      <motion.div 
        className="lego-connector right" 
        style={{ backgroundColor: category.color }}
        whileHover={{ scale: 1.2, x: 2 }}
        transition={{ type: "spring", stiffness: 400 }}
      />

      {/* React Flow handles for connections */}
      <Handle type="target" position={Position.Top} className="opacity-0" id="top" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" id="bottom" />
      <Handle type="target" position={Position.Left} className="opacity-0" id="left" />
      <Handle type="source" position={Position.Right} className="opacity-0" id="right" />

      {/* Category badge */}
      <div 
        className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: category.color }}
      >
        {category.name}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 leading-tight">
          {axiom.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {axiom.description}
        </p>
        
        {axiom.metadata?.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {axiom.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {isAccepted && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full"></div>
      )}
      {isRejected && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full"></div>
      )}
    </motion.div>
  );
}

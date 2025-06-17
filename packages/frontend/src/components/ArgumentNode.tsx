import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Argument, AxiomCategory } from '@philsaxioms/shared';
import clsx from 'clsx';
import { ChevronRight, Target } from 'lucide-react';

interface ArgumentNodeProps {
  data: {
    argument: Argument;
    category: AxiomCategory;
    isSelected: boolean;
    isValid: boolean; // Based on accepted prerequisite axioms/arguments
    onSelect: (argument: Argument) => void;
  };
}

export default function ArgumentNode({ data }: ArgumentNodeProps) {
  const { argument, category, isSelected, isValid, onSelect } = data;

  const handleClick = () => {
    onSelect(argument);
  };

  const getValidityColor = () => {
    if (isValid) return 'border-green-400 bg-green-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getLevelBadgeColor = () => {
    switch (argument.level) {
      case 1: return 'bg-blue-500';
      case 2: return 'bg-purple-500';
      case 3: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      className={clsx(
        'relative p-4 min-w-[240px] max-w-[320px] rounded-lg shadow-lg cursor-pointer transition-all duration-200 border-2',
        getValidityColor(),
        {
          'ring-4 ring-blue-400 ring-opacity-50': isSelected,
        }
      )}
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* React Flow handles for connections */}
      <Handle type="target" position={Position.Top} className="opacity-0" id="top" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" id="bottom" />
      <Handle type="target" position={Position.Left} className="opacity-0" id="left" />
      <Handle type="source" position={Position.Right} className="opacity-0" id="right" />

      {/* Level badge */}
      <div 
        className={clsx(
          "absolute -top-2 -left-2 px-2 py-1 rounded-full text-xs font-bold text-white",
          getLevelBadgeColor()
        )}
      >
        L{argument.level}
      </div>

      {/* Category badge */}
      <div 
        className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: category.color }}
      >
        {category.name}
      </div>

      {/* Validity indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <Target 
          className={clsx(
            "w-3 h-3",
            isValid ? "text-green-500" : "text-gray-400"
          )} 
        />
      </div>

      {/* Content */}
      <div className="space-y-3 mt-4">
        <h3 className="font-bold text-gray-900 leading-tight text-sm">
          {argument.title}
        </h3>
        
        <p className="text-xs text-gray-600 leading-relaxed">
          {argument.description}
        </p>

        {/* Conclusion with arrow */}
        <div className="border-t border-gray-200 pt-2">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium text-blue-700 leading-tight">
              {argument.conclusion}
            </p>
          </div>
        </div>
        
        {/* Strength indicator */}
        {argument.metadata?.strength && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Strength:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${argument.metadata.strength * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(argument.metadata.strength * 100)}%
            </span>
          </div>
        )}

        {argument.metadata?.tags && (
          <div className="flex flex-wrap gap-1">
            {argument.metadata.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

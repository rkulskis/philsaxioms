import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { QuestionnaireItem, AxiomCategory } from '@philsaxioms/shared';
import { apiClient } from '../utils/api';

interface QuestionnaireProps {
  onComplete: (acceptedAxioms: string[], rejectedAxioms: string[]) => void;
  onSkip: () => void;
  categories: AxiomCategory[];
}

export default function Questionnaire({ onComplete, onSkip, categories }: QuestionnaireProps) {
  const [questions, setQuestions] = useState<QuestionnaireItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestionnaire() {
      try {
        const questionnaire = await apiClient.fetchQuestionnaire();
        setQuestions(questionnaire);
      } catch (error) {
        console.error('Failed to load questionnaire:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestionnaire();
  }, []);

  const currentQuestion = questions[currentIndex];
  const category = categories.find(c => c.id === currentQuestion?.category);
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (accept: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.axiomId]: accept
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const accepted = Object.entries(answers)
        .filter(([_, value]) => value)
        .map(([axiomId]) => axiomId);
      
      const rejected = Object.entries(answers)
        .filter(([_, value]) => !value)
        .map(([axiomId]) => axiomId);

      if (currentQuestion.axiomId) {
        if (accept) {
          accepted.push(currentQuestion.axiomId);
        } else {
          rejected.push(currentQuestion.axiomId);
        }
      }

      onComplete(accepted, rejected);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading philosophical axioms...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Error loading questionnaire</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header with skip option */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PhilsAxioms</h1>
          <p className="text-gray-600 mb-4">
            Build your philosophical framework by answering these foundational questions
          </p>
          <button
            onClick={onSkip}
            className="text-indigo-600 hover:text-indigo-800 underline text-sm"
          >
            Skip questionnaire and explore all axioms →
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-indigo-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-xl p-8"
          >
            {/* Category badge */}
            {category && (
              <div 
                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-4"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </div>
            )}

            {/* Question */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentQuestion.text}
            </h2>

            {/* Explanation removed in new format */}

            {/* Answer buttons */}
            <div className="flex gap-4 mb-6">
              <motion.button
                onClick={() => handleAnswer(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-5 h-5" />
                Yes, I accept this
              </motion.button>

              <motion.button
                onClick={() => handleAnswer(false)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-5 h-5" />
                No, I reject this
              </motion.button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={goBack}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-gray-400">
                {currentIndex < questions.length - 1 ? 'Continue' : 'Finish'} 
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
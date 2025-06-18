import { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DesktopOnlyWrapper from './components/DesktopOnlyWrapper';
import { useGraphData } from './hooks/useGraphData';
import { apiClient } from './utils/api';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { UserSession } from '@philsaxioms/shared';

// Lazy load heavy components
const Questionnaire = lazy(() => import('./components/Questionnaire'));
const GraphView = lazy(() => import('./components/GraphView'));

function App() {
  const { data: graphData, loading, error } = useGraphData();
  
  const [session, setSession] = useState<UserSession | null>(null);
  const navigate = useNavigate();

  const handleQuestionnaireComplete = async (acceptedAxioms: string[], rejectedAxioms: string[]) => {
    try {
      const newSession = await apiClient.createSession(acceptedAxioms, rejectedAxioms);
      console.log('Session created:', newSession);
      
      // Set session state and navigate in sequence
      setSession(newSession);
      
      // Wait for state to update before navigating
      setTimeout(() => {
        navigate('/explore');
      }, 100);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSkipQuestionnaire = async () => {
    try {
      // Create a session with no accepted/rejected axioms
      const newSession = await apiClient.createSession([], []);
      console.log('Empty session created for exploration:', newSession);
      
      // Set session state and navigate in sequence
      setSession(newSession);
      
      // Wait for state to update before navigating
      setTimeout(() => {
        navigate('/explore');
      }, 100);
    } catch (error) {
      console.error('Failed to create empty session:', error);
    }
  };

  const handleSessionUpdate = async (updates: Partial<UserSession>) => {
    if (!session) return;
    
    try {
      const updatedSession = await apiClient.updateSession(session.id, updates);
      setSession(updatedSession);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner message="Loading PhilsAxioms..." size="lg" />
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error Loading Data</h1>
          <p className="text-red-600">{error || 'Failed to load graph data'}</p>
        </div>
      </div>
    );
  }

  return (
    <DesktopOnlyWrapper>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingSpinner message="Loading questionnaire..." size="lg" />}>
                <Questionnaire
                  onComplete={handleQuestionnaireComplete}
                  onSkip={handleSkipQuestionnaire}
                  categories={graphData.categories}
                />
              </Suspense>
            }
          />
          <Route
            path="/explore"
            element={
              !graphData ? (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading graph data...</p>
                  </div>
                </div>
              ) : !session ? (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Creating session...</p>
                    <p className="text-sm text-gray-500 mt-2">If this takes too long, please go back and try again.</p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Back to Start
                    </button>
                  </div>
                </div>
              ) : (
                <Suspense fallback={<LoadingSpinner message="Loading graph visualization..." size="lg" />}>
                  <GraphView
                    nodes={graphData.nodes}
                    categories={graphData.categories}
                    session={session}
                    onSessionUpdate={handleSessionUpdate}
                  />
                </Suspense>
              )
            }
          />
        </Routes>
      </div>
    </DesktopOnlyWrapper>
  );
}

export default App;
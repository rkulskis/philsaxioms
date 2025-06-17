import { GraphData, QuestionnaireItem, UserSession } from '@philsaxioms/shared';

class StaticApiClient {
  private graphDataCache: GraphData | null = null;
  private questionnaireCache: QuestionnaireItem[] | null = null;

  async getGraphData(): Promise<GraphData> {
    if (this.graphDataCache) {
      return this.graphDataCache;
    }

    try {
      const response = await fetch('/philsaxioms/graph-data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch graph data: ${response.statusText}`);
      }
      this.graphDataCache = await response.json();
      return this.graphDataCache!;
    } catch (error) {
      console.error('Error loading graph data:', error);
      throw error;
    }
  }

  async getQuestionnaire(): Promise<QuestionnaireItem[]> {
    if (this.questionnaireCache) {
      return this.questionnaireCache;
    }

    try {
      const response = await fetch('/philsaxioms/questionnaire.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch questionnaire: ${response.statusText}`);
      }
      this.questionnaireCache = await response.json();
      return this.questionnaireCache!;
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      throw error;
    }
  }

  async createSession(): Promise<UserSession> {
    // Generate a simple client-side session
    return {
      id: this.generateSessionId(),
      acceptedAxioms: [],
      rejectedAxioms: [],
      createdAt: new Date(),
    };
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession> {
    // For static deployment, we'll just return the updated session
    // In a real static app, you might save to localStorage
    const stored = this.getStoredSession(sessionId);
    const updated = { ...stored, ...updates };
    this.storeSession(updated);
    return updated;
  }

  async createSnapshot(
    sessionId: string,
    title: string,
    description: string,
    isPublic: boolean
  ): Promise<{ id: string; url: string }> {
    // For static deployment, we'll generate a simple snapshot
    const snapshotId = this.generateSessionId();
    const session = this.getStoredSession(sessionId);
    
    // Store snapshot in localStorage
    const snapshot = {
      id: snapshotId,
      title,
      description,
      isPublic,
      session,
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`snapshot_${snapshotId}`, JSON.stringify(snapshot));
    
    return {
      id: snapshotId,
      url: `${window.location.origin}/philsaxioms/?snapshot=${snapshotId}`,
    };
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private getStoredSession(sessionId: string): UserSession {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return default session if not found
    return {
      id: sessionId,
      acceptedAxioms: [],
      rejectedAxioms: [],
      createdAt: new Date(),
    };
  }

  private storeSession(session: UserSession): void {
    localStorage.setItem(`session_${session.id}`, JSON.stringify(session));
  }
}

export default new StaticApiClient();
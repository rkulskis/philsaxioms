import { GraphData, QuestionnaireItem, UserSession, Axiom } from '@philsaxioms/shared';
import staticClient from '../api/static-client';

const API_BASE = '/api';
const isStaticDeployment = !import.meta.env.DEV && !window.location.hostname.includes('localhost');

export class ApiClient {
  async fetchGraphData(): Promise<GraphData> {
    if (isStaticDeployment) {
      return await staticClient.getGraphData();
    }
    
    const response = await fetch(`${API_BASE}/graph`);
    if (!response.ok) {
      throw new Error('Failed to fetch graph data');
    }
    return response.json();
  }

  async fetchQuestionnaire(): Promise<QuestionnaireItem[]> {
    if (isStaticDeployment) {
      return await staticClient.getQuestionnaire();
    }
    
    const response = await fetch(`${API_BASE}/questionnaire`);
    if (!response.ok) {
      throw new Error('Failed to fetch questionnaire');
    }
    return response.json();
  }

  async fetchAxiom(id: string): Promise<Axiom> {
    const response = await fetch(`${API_BASE}/axioms/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch axiom');
    }
    return response.json();
  }

  async fetchAxiomConnections(id: string): Promise<{ axiom: Axiom; edge: any; direction: 'incoming' | 'outgoing' }[]> {
    const response = await fetch(`${API_BASE}/axioms/${id}/connections`);
    if (!response.ok) {
      throw new Error('Failed to fetch axiom connections');
    }
    return response.json();
  }

  async createSession(acceptedAxioms: string[] = [], rejectedAxioms: string[] = []): Promise<UserSession> {
    if (isStaticDeployment) {
      const session = await staticClient.createSession();
      return await staticClient.updateSession(session.id, { acceptedAxioms, rejectedAxioms });
    }
    
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acceptedAxioms, rejectedAxioms }),
    });
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    return response.json();
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession> {
    if (isStaticDeployment) {
      return await staticClient.updateSession(sessionId, updates);
    }
    
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update session');
    }
    return response.json();
  }

  async fetchSession(sessionId: string): Promise<UserSession> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }
    return response.json();
  }

  async createSnapshot(sessionId: string, title: string, description?: string, isPublic: boolean = false): Promise<any> {
    if (isStaticDeployment) {
      return await staticClient.createSnapshot(sessionId, title, description || '', isPublic);
    }
    
    const response = await fetch(`${API_BASE}/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, title, description, isPublic }),
    });
    if (!response.ok) {
      throw new Error('Failed to create snapshot');
    }
    return response.json();
  }

  async fetchSnapshot(snapshotId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/snapshots/${snapshotId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch snapshot');
    }
    return response.json();
  }

  async fetchPublicSnapshots(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/snapshots`);
    if (!response.ok) {
      throw new Error('Failed to fetch public snapshots');
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
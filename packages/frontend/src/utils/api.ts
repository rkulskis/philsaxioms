import { GraphData, QuestionnaireItem, UserSession, Axiom } from '@philsaxioms/shared';
import { BrowserHttpClient } from './browser-http-client';
import staticClient from '../api/static-client';

const API_BASE = '/api';
const isStaticDeployment = !import.meta.env.DEV && !window.location.hostname.includes('localhost');

export class ApiClient {
  private httpClient: BrowserHttpClient;

  constructor() {
    this.httpClient = new BrowserHttpClient(API_BASE);
  }

  async fetchGraphData(): Promise<GraphData> {
    if (isStaticDeployment) {
      return await staticClient.getGraphData();
    }
    
    return this.httpClient.get<GraphData>('/graph');
  }

  async fetchQuestionnaire(): Promise<QuestionnaireItem[]> {
    if (isStaticDeployment) {
      return await staticClient.getQuestionnaire();
    }
    
    return this.httpClient.get<QuestionnaireItem[]>('/questionnaire');
  }

  async fetchAxiom(id: string): Promise<Axiom> {
    return this.httpClient.get<Axiom>(`/axioms/${id}`);
  }

  async fetchAxiomConnections(id: string): Promise<{ axiom: Axiom; edge: any; direction: 'incoming' | 'outgoing' }[]> {
    return this.httpClient.get<{ axiom: Axiom; edge: any; direction: 'incoming' | 'outgoing' }[]>(`/axioms/${id}/connections`);
  }

  async createSession(acceptedAxioms: string[] = [], rejectedAxioms: string[] = []): Promise<UserSession> {
    if (isStaticDeployment) {
      const session = await staticClient.createSession();
      return await staticClient.updateSession(session.id, { acceptedAxioms, rejectedAxioms });
    }
    
    return this.httpClient.post<UserSession>('/sessions', { acceptedAxioms, rejectedAxioms });
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession> {
    if (isStaticDeployment) {
      return await staticClient.updateSession(sessionId, updates);
    }
    
    return this.httpClient.put<UserSession>(`/sessions/${sessionId}`, updates);
  }

  async fetchSession(sessionId: string): Promise<UserSession> {
    return this.httpClient.get<UserSession>(`/sessions/${sessionId}`);
  }

  async createSnapshot(sessionId: string, title: string, description?: string, isPublic: boolean = false): Promise<any> {
    if (isStaticDeployment) {
      return await staticClient.createSnapshot(sessionId, title, description || '', isPublic);
    }
    
    return this.httpClient.post<any>('/snapshots', { sessionId, title, description, isPublic });
  }

  async fetchSnapshot(snapshotId: string): Promise<any> {
    return this.httpClient.get<any>(`/snapshots/${snapshotId}`);
  }

  async fetchPublicSnapshots(): Promise<any[]> {
    return this.httpClient.get<any[]>('/snapshots');
  }
}

export const apiClient = new ApiClient();
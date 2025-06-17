import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import chokidar from 'chokidar';
import { Axiom, Argument, Edge, AxiomCategory, QuestionnaireItem, GraphData } from '@philsaxioms/shared';

export class YamlDataLoader {
  private dataPath: string;
  private cache: GraphData | null = null;
  private questionnaireCache: QuestionnaireItem[] | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private callbacks: (() => void)[] = [];

  constructor(dataPath: string) {
    this.dataPath = path.resolve(dataPath);
    this.setupWatcher();
  }

  private setupWatcher() {
    this.watcher = chokidar.watch(this.dataPath, {
      ignored: /node_modules/,
      persistent: true
    });

    this.watcher.on('change', () => {
      console.log('YAML files changed, reloading data...');
      this.invalidateCache();
      this.notifyCallbacks();
    });

    this.watcher.on('add', () => {
      this.invalidateCache();
      this.notifyCallbacks();
    });

    this.watcher.on('unlink', () => {
      this.invalidateCache();
      this.notifyCallbacks();
    });
  }

  private invalidateCache() {
    this.cache = null;
    this.questionnaireCache = null;
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback());
  }

  public onDataChange(callback: () => void) {
    this.callbacks.push(callback);
  }

  private loadYamlFile<T>(filePath: string): T | null {
    try {
      const fullPath = path.join(this.dataPath, filePath);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      return YAML.parse(content);
    } catch (error) {
      console.error(`Error loading YAML file ${filePath}:`, error);
      return null;
    }
  }

  private loadYamlFiles<T>(pattern: string, key: string): T[] {
    const results: T[] = [];
    
    try {
      const dir = path.dirname(pattern);
      const filename = path.basename(pattern);
      const fullDir = path.join(this.dataPath, dir);
      
      if (!fs.existsSync(fullDir)) {
        return results;
      }

      const files = fs.readdirSync(fullDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .filter(file => filename === '*' || file === filename);

      for (const file of files) {
        const data = this.loadYamlFile<any>(path.join(dir, file));
        if (data && data[key] && Array.isArray(data[key])) {
          results.push(...data[key]);
        }
      }
    } catch (error) {
      console.error(`Error loading YAML files with pattern ${pattern}:`, error);
    }

    return results;
  }

  public async loadGraphData(): Promise<GraphData> {
    if (this.cache) {
      return this.cache;
    }

    console.log('Loading graph data from YAML files...');

    const categories = this.loadYamlFile<{ categories: AxiomCategory[] }>('categories.yaml')?.categories || [];
    const axioms = this.loadYamlFiles<Axiom>('axioms/*', 'axioms');
    const argumentNodes = this.loadYamlFiles<Argument>('arguments/*', 'arguments');
    const edges = this.loadYamlFiles<Edge>('edges/*', 'edges');

    this.cache = {
      categories,
      axioms,
      arguments: argumentNodes,
      edges
    };

    console.log(`Loaded ${axioms.length} axioms, ${argumentNodes.length} arguments, ${edges.length} edges, ${categories.length} categories`);
    
    return this.cache;
  }

  public async loadQuestionnaire(): Promise<QuestionnaireItem[]> {
    if (this.questionnaireCache) {
      return this.questionnaireCache;
    }

    const data = this.loadYamlFile<{ questionnaire: QuestionnaireItem[] }>('questionnaire.yaml');
    this.questionnaireCache = data?.questionnaire || [];
    
    return this.questionnaireCache;
  }

  public async getAxiomById(id: string): Promise<Axiom | null> {
    const data = await this.loadGraphData();
    return data.axioms.find(axiom => axiom.id === id) || null;
  }

  public async getAxiomsByCategory(category: string): Promise<Axiom[]> {
    const data = await this.loadGraphData();
    return data.axioms.filter(axiom => axiom.category === category);
  }

  public async getConnectedNodes(nodeId: string): Promise<{ node: Axiom | Argument; nodeType: 'axiom' | 'argument'; edge: Edge; direction: 'incoming' | 'outgoing' }[]> {
    const data = await this.loadGraphData();
    const connections: { node: Axiom | Argument; nodeType: 'axiom' | 'argument'; edge: Edge; direction: 'incoming' | 'outgoing' }[] = [];

    for (const edge of data.edges) {
      let connectedNodeId: string | null = null;
      let connectedNodeType: 'axiom' | 'argument' | null = null;
      let direction: 'incoming' | 'outgoing' | null = null;

      if (edge.fromNode === nodeId) {
        connectedNodeId = edge.toNode;
        connectedNodeType = edge.toType;
        direction = 'outgoing';
      } else if (edge.toNode === nodeId) {
        connectedNodeId = edge.fromNode;
        connectedNodeType = edge.fromType;
        direction = 'incoming';
      }

      if (connectedNodeId && connectedNodeType && direction) {
        let node: Axiom | Argument | undefined;
        if (connectedNodeType === 'axiom') {
          node = data.axioms.find(a => a.id === connectedNodeId);
        } else {
          node = data.arguments.find(a => a.id === connectedNodeId);
        }
        
        if (node) {
          connections.push({ node, nodeType: connectedNodeType, edge, direction });
        }
      }
    }

    return connections;
  }

  public close() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
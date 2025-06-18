"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlDataLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const chokidar_1 = __importDefault(require("chokidar"));
const shared_1 = require("@philsaxioms/shared");
class YamlDataLoader extends shared_1.YamlLoaderBase {
    constructor(dataPath) {
        super(path.resolve(dataPath));
        this.cache = null;
        this.questionnaireCache = null;
        this.watcher = null;
        this.callbacks = [];
        this.setupWatcher();
    }
    parseYaml(content) {
        return yaml_1.default.parse(content);
    }
    setupWatcher() {
        this.watcher = chokidar_1.default.watch(this.dataPath, {
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
    invalidateCache() {
        this.cache = null;
        this.questionnaireCache = null;
    }
    notifyCallbacks() {
        this.callbacks.forEach(callback => callback());
    }
    onDataChange(callback) {
        this.callbacks.push(callback);
    }
    loadYamlFileWithNull(filePath) {
        try {
            return super.loadYamlFile(this.getDataPath(filePath));
        }
        catch (error) {
            console.error(`Error loading YAML file ${filePath}:`, error);
            return null;
        }
    }
    loadYamlFiles(pattern, key) {
        try {
            return super.loadYamlFiles(pattern, key);
        }
        catch (error) {
            console.error(`Error loading YAML files with pattern ${pattern}:`, error);
            return [];
        }
    }
    async loadGraphData() {
        if (this.cache) {
            return this.cache;
        }
        console.log('Loading graph data from YAML files...');
        const categories = this.loadYamlFileWithNull('categories.yaml')?.categories || [];
        const nodesData = this.loadYamlFileWithNull('nodes.yaml')?.nodes || [];
        this.cache = {
            categories,
            nodes: nodesData
        };
        console.log(`Loaded ${nodesData.length} nodes, ${categories.length} categories`);
        return this.cache;
    }
    async loadQuestionnaire() {
        if (this.questionnaireCache) {
            return this.questionnaireCache;
        }
        const data = this.loadYamlFileWithNull('questionnaire.yaml');
        this.questionnaireCache = data?.questionnaire || [];
        return this.questionnaireCache;
    }
    async getNodeById(id) {
        const data = await this.loadGraphData();
        return data.nodes.find(node => node.id === id) || null;
    }
    async getAxiomById(id) {
        const data = await this.loadGraphData();
        const node = data.nodes.find(node => node.id === id && node.type === 'axiom');
        return node || null;
    }
    async getAxiomsByCategory(category) {
        const data = await this.loadGraphData();
        return data.nodes.filter(node => node.type === 'axiom' && node.category === category);
    }
    async getConnectedNodes(nodeId) {
        const data = await this.loadGraphData();
        const connections = [];
        // Find outgoing connections (this node's edges)
        const sourceNode = data.nodes.find(node => node.id === nodeId);
        if (sourceNode) {
            for (const edge of sourceNode.edges) {
                const targetNode = data.nodes.find(node => node.id === edge.to);
                if (targetNode) {
                    connections.push({
                        node: targetNode,
                        type: edge.type,
                        direction: 'outgoing'
                    });
                }
            }
        }
        // Find incoming connections (edges pointing to this node)
        for (const node of data.nodes) {
            for (const edge of node.edges) {
                if (edge.to === nodeId) {
                    connections.push({
                        node,
                        type: edge.type,
                        direction: 'incoming'
                    });
                }
            }
        }
        return connections;
    }
    async addNode(node) {
        // Load existing nodes
        const nodesData = this.loadYamlFileWithNull('nodes.yaml')?.nodes || [];
        // Add the new node
        nodesData.push(node);
        // Write back to file
        const yamlContent = yaml_1.default.stringify({ nodes: nodesData });
        const filePath = this.getDataPath('nodes.yaml');
        fs.writeFileSync(filePath, yamlContent, 'utf8');
        // Invalidate cache
        this.invalidateCache();
    }
    async deleteNode(nodeId) {
        // Load existing nodes
        const nodesData = this.loadYamlFileWithNull('nodes.yaml')?.nodes || [];
        // Remove the node and any edges pointing to it
        const filteredNodes = nodesData
            .filter(node => node.id !== nodeId)
            .map(node => ({
            ...node,
            edges: node.edges.filter(edge => edge.to !== nodeId)
        }));
        // Write back to file
        const yamlContent = yaml_1.default.stringify({ nodes: filteredNodes });
        const filePath = this.getDataPath('nodes.yaml');
        fs.writeFileSync(filePath, yamlContent, 'utf8');
        // Invalidate cache
        this.invalidateCache();
    }
    close() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}
exports.YamlDataLoader = YamlDataLoader;

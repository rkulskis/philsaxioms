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
        const axioms = this.loadYamlFiles('axioms/*', 'axioms');
        const argumentNodes = this.loadYamlFiles('arguments/*', 'arguments');
        const edges = this.loadYamlFiles('edges/*', 'edges');
        this.cache = {
            categories,
            axioms,
            arguments: argumentNodes,
            edges
        };
        console.log(`Loaded ${axioms.length} axioms, ${argumentNodes.length} arguments, ${edges.length} edges, ${categories.length} categories`);
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
    async getAxiomById(id) {
        const data = await this.loadGraphData();
        return data.axioms.find(axiom => axiom.id === id) || null;
    }
    async getAxiomsByCategory(category) {
        const data = await this.loadGraphData();
        return data.axioms.filter(axiom => axiom.category === category);
    }
    async getConnectedNodes(nodeId) {
        const data = await this.loadGraphData();
        const connections = [];
        for (const edge of data.edges) {
            let connectedNodeId = null;
            let connectedNodeType = null;
            let direction = null;
            if (edge.fromNode === nodeId) {
                connectedNodeId = edge.toNode;
                connectedNodeType = edge.toType;
                direction = 'outgoing';
            }
            else if (edge.toNode === nodeId) {
                connectedNodeId = edge.fromNode;
                connectedNodeType = edge.fromType;
                direction = 'incoming';
            }
            if (connectedNodeId && connectedNodeType && direction) {
                let node;
                if (connectedNodeType === 'axiom') {
                    node = data.axioms.find(a => a.id === connectedNodeId);
                }
                else {
                    node = data.arguments.find(a => a.id === connectedNodeId);
                }
                if (node) {
                    connections.push({ node, nodeType: connectedNodeType, edge, direction });
                }
            }
        }
        return connections;
    }
    close() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}
exports.YamlDataLoader = YamlDataLoader;

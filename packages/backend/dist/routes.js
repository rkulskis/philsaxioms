"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const shared_1 = require("@philsaxioms/shared");
const response_handler_1 = require("./utils/response-handler");
function createRoutes(dataLoader) {
    const router = (0, express_1.Router)();
    // Get all graph data (axioms, edges, categories)
    router.get('/api/graph', response_handler_1.ResponseHandler.createDataRoute(() => dataLoader.loadGraphData(), 'Failed to load graph data'));
    // Get questionnaire items
    router.get('/api/questionnaire', response_handler_1.ResponseHandler.createDataRoute(() => dataLoader.loadQuestionnaire(), 'Failed to load questionnaire'));
    // Get specific axiom by ID
    router.get('/api/axioms/:id', response_handler_1.ResponseHandler.createFindByIdRoute((id) => dataLoader.getAxiomById(id), 'Failed to load axiom', 'Axiom not found'));
    // Get axioms by category
    router.get('/api/axioms/category/:category', response_handler_1.ResponseHandler.wrapAsyncRoute(async (req, res) => {
        const axioms = await dataLoader.getAxiomsByCategory(req.params.category);
        response_handler_1.ResponseHandler.handleSuccess(res, axioms);
    }));
    // Get connected nodes (axioms or arguments)
    router.get('/api/nodes/:id/connections', response_handler_1.ResponseHandler.wrapAsyncRoute(async (req, res) => {
        const connections = await dataLoader.getConnectedNodes(req.params.id);
        response_handler_1.ResponseHandler.handleSuccess(res, connections);
    }));
    // Get specific argument by ID
    router.get('/api/arguments/:id', response_handler_1.ResponseHandler.createFindByIdRoute(async (id) => {
        const data = await dataLoader.loadGraphData();
        return data.arguments.find(arg => arg.id === id) || null;
    }, 'Failed to load argument', 'Argument not found'));
    // Simple in-memory storage (replace with database in production)
    const sessions = new Map();
    const snapshots = new Map();
    // Create new user session
    router.post('/api/sessions', (req, res) => {
        const { acceptedAxioms = [], rejectedAxioms = [] } = req.body;
        const session = {
            id: (0, shared_1.generateSessionId)(),
            acceptedAxioms,
            rejectedAxioms,
            exploredConnections: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        sessions.set(session.id, session);
        res.json(session);
    });
    // Get session by ID
    router.get('/api/sessions/:id', (req, res) => {
        const session = sessions.get(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    });
    // Update session
    router.put('/api/sessions/:id', (req, res) => {
        const session = sessions.get(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        const { acceptedAxioms, rejectedAxioms, exploredConnections } = req.body;
        if (acceptedAxioms)
            session.acceptedAxioms = acceptedAxioms;
        if (rejectedAxioms)
            session.rejectedAxioms = rejectedAxioms;
        if (exploredConnections)
            session.exploredConnections = exploredConnections;
        session.updatedAt = new Date();
        sessions.set(session.id, session);
        res.json(session);
    });
    // Create snapshot
    router.post('/api/snapshots', async (req, res) => {
        try {
            const { title, description, sessionId, isPublic = false } = req.body;
            const session = sessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            const data = await dataLoader.loadGraphData();
            const relevantAxioms = session.acceptedAxioms;
            const relevantEdges = data.edges.filter(edge => relevantAxioms.includes(edge.fromNode) && relevantAxioms.includes(edge.toNode));
            const snapshot = {
                id: (0, shared_1.generateSnapshotId)(),
                title,
                description,
                axioms: relevantAxioms,
                edges: relevantEdges.map(e => e.id),
                metadata: {
                    isPublic,
                    createdBy: sessionId,
                },
                createdAt: new Date(),
            };
            snapshots.set(snapshot.id, snapshot);
            res.json(snapshot);
        }
        catch (error) {
            console.error('Error creating snapshot:', error);
            res.status(500).json({ error: 'Failed to create snapshot' });
        }
    });
    // Get snapshot by ID
    router.get('/api/snapshots/:id', async (req, res) => {
        try {
            const snapshot = snapshots.get(req.params.id);
            if (!snapshot) {
                return res.status(404).json({ error: 'Snapshot not found' });
            }
            const data = await dataLoader.loadGraphData();
            const snapshotAxioms = data.axioms.filter(axiom => snapshot.axioms.includes(axiom.id));
            const snapshotEdges = data.edges.filter(edge => snapshot.edges.includes(edge.id));
            res.json({
                ...snapshot,
                axiomData: snapshotAxioms,
                edgeData: snapshotEdges,
                categories: data.categories,
            });
        }
        catch (error) {
            console.error('Error loading snapshot:', error);
            res.status(500).json({ error: 'Failed to load snapshot' });
        }
    });
    // List public snapshots
    router.get('/api/snapshots', (req, res) => {
        const publicSnapshots = Array.from(snapshots.values())
            .filter(snapshot => snapshot.metadata?.isPublic)
            .map(snapshot => ({
            id: snapshot.id,
            title: snapshot.title,
            description: snapshot.description,
            createdAt: snapshot.createdAt,
            axiomCount: snapshot.axioms.length,
        }));
        res.json(publicSnapshots);
    });
    // Health check
    router.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    return router;
}

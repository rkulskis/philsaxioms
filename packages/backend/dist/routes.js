"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
function createRoutes(dataLoader) {
    const router = (0, express_1.Router)();
    // Get all graph data (axioms, edges, categories)
    router.get('/api/graph', async (req, res) => {
        try {
            const data = await dataLoader.loadGraphData();
            res.json(data);
        }
        catch (error) {
            console.error('Error loading graph data:', error);
            res.status(500).json({ error: 'Failed to load graph data' });
        }
    });
    // Get questionnaire items
    router.get('/api/questionnaire', async (req, res) => {
        try {
            const questionnaire = await dataLoader.loadQuestionnaire();
            res.json(questionnaire);
        }
        catch (error) {
            console.error('Error loading questionnaire:', error);
            res.status(500).json({ error: 'Failed to load questionnaire' });
        }
    });
    // Get specific axiom by ID
    router.get('/api/axioms/:id', async (req, res) => {
        try {
            const axiom = await dataLoader.getAxiomById(req.params.id);
            if (!axiom) {
                return res.status(404).json({ error: 'Axiom not found' });
            }
            res.json(axiom);
        }
        catch (error) {
            console.error('Error loading axiom:', error);
            res.status(500).json({ error: 'Failed to load axiom' });
        }
    });
    // Get axioms by category
    router.get('/api/axioms/category/:category', async (req, res) => {
        try {
            const axioms = await dataLoader.getAxiomsByCategory(req.params.category);
            res.json(axioms);
        }
        catch (error) {
            console.error('Error loading axioms by category:', error);
            res.status(500).json({ error: 'Failed to load axioms' });
        }
    });
    // Get connected nodes (axioms or arguments)
    router.get('/api/nodes/:id/connections', async (req, res) => {
        try {
            const connections = await dataLoader.getConnectedNodes(req.params.id);
            res.json(connections);
        }
        catch (error) {
            console.error('Error loading connections:', error);
            res.status(500).json({ error: 'Failed to load connections' });
        }
    });
    // Get specific argument by ID
    router.get('/api/arguments/:id', async (req, res) => {
        try {
            const data = await dataLoader.loadGraphData();
            const argument = data.arguments.find(arg => arg.id === req.params.id);
            if (!argument) {
                return res.status(404).json({ error: 'Argument not found' });
            }
            res.json(argument);
        }
        catch (error) {
            console.error('Error loading argument:', error);
            res.status(500).json({ error: 'Failed to load argument' });
        }
    });
    // Simple in-memory storage (replace with database in production)
    const sessions = new Map();
    const snapshots = new Map();
    // Create new user session
    router.post('/api/sessions', (req, res) => {
        const { acceptedAxioms = [], rejectedAxioms = [] } = req.body;
        const session = {
            id: Math.random().toString(36).substr(2, 9),
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
                id: Math.random().toString(36).substr(2, 9),
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("../routes");
// Mock the YamlDataLoader
const mockDataLoader = {
    loadGraphData: vitest_1.vi.fn(),
    loadQuestionnaire: vitest_1.vi.fn(),
    getAxiomById: vitest_1.vi.fn(),
    getAxiomsByCategory: vitest_1.vi.fn(),
    getConnectedNodes: vitest_1.vi.fn(),
    close: vitest_1.vi.fn(),
};
const mockGraphData = {
    axioms: [
        {
            id: 'test-axiom-1',
            title: 'Test Axiom 1',
            description: 'This is a test axiom',
            category: 'ethics',
        },
    ],
    arguments: [
        {
            id: 'test-argument-1',
            title: 'Test Argument 1',
            description: 'This is a test argument',
            conclusion: 'Test conclusion',
            category: 'ethics',
            level: 1,
        },
    ],
    edges: [
        {
            id: 'test-edge-1',
            fromNode: 'test-axiom-1',
            toNode: 'test-argument-1',
            fromType: 'axiom',
            toType: 'argument',
            relation: { type: 'supports', strength: 0.8 },
            explanation: 'Test explanation',
        },
    ],
    categories: [
        {
            id: 'ethics',
            name: 'Ethics',
            color: '#EF4444',
            description: 'Moral principles',
        },
    ],
};
const mockQuestionnaire = [
    {
        axiomId: 'test-axiom-1',
        question: 'Do you accept this test axiom?',
        explanation: 'This is for testing',
        category: 'ethics',
    },
];
(0, vitest_1.describe)('API Routes', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        app = (0, express_1.default)();
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        app.use((0, routes_1.createRoutes)(mockDataLoader));
        // Setup default mocks
        mockDataLoader.loadGraphData.mockResolvedValue(mockGraphData);
        mockDataLoader.loadQuestionnaire.mockResolvedValue(mockQuestionnaire);
        mockDataLoader.getAxiomById.mockResolvedValue(mockGraphData.axioms[0]);
        mockDataLoader.getAxiomsByCategory.mockResolvedValue([mockGraphData.axioms[0]]);
        mockDataLoader.getConnectedNodes.mockResolvedValue([]);
    });
    (0, vitest_1.describe)('GET /api/health', () => {
        (0, vitest_1.it)('returns health status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/health')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual({
                status: 'ok',
                timestamp: vitest_1.expect.any(String),
            });
        });
    });
    (0, vitest_1.describe)('GET /api/graph', () => {
        (0, vitest_1.it)('returns graph data', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/graph')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual(mockGraphData);
            (0, vitest_1.expect)(mockDataLoader.loadGraphData).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('handles errors gracefully', async () => {
            mockDataLoader.loadGraphData.mockRejectedValue(new Error('Test error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/graph')
                .expect(500);
            (0, vitest_1.expect)(response.body).toEqual({
                error: 'Failed to load graph data',
            });
        });
    });
    (0, vitest_1.describe)('GET /api/questionnaire', () => {
        (0, vitest_1.it)('returns questionnaire data', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/questionnaire')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual(mockQuestionnaire);
            (0, vitest_1.expect)(mockDataLoader.loadQuestionnaire).toHaveBeenCalledOnce();
        });
    });
    (0, vitest_1.describe)('GET /api/axioms/:id', () => {
        (0, vitest_1.it)('returns specific axiom', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/axioms/test-axiom-1')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual(mockGraphData.axioms[0]);
            (0, vitest_1.expect)(mockDataLoader.getAxiomById).toHaveBeenCalledWith('test-axiom-1');
        });
        (0, vitest_1.it)('returns 404 for non-existent axiom', async () => {
            mockDataLoader.getAxiomById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/axioms/non-existent')
                .expect(404);
            (0, vitest_1.expect)(response.body).toEqual({
                error: 'Axiom not found',
            });
        });
    });
    (0, vitest_1.describe)('GET /api/arguments/:id', () => {
        (0, vitest_1.it)('returns specific argument', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/arguments/test-argument-1')
                .expect(200);
            (0, vitest_1.expect)(response.body).toEqual(mockGraphData.arguments[0]);
            (0, vitest_1.expect)(mockDataLoader.loadGraphData).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('returns 404 for non-existent argument', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/arguments/non-existent')
                .expect(404);
            (0, vitest_1.expect)(response.body).toEqual({
                error: 'Argument not found',
            });
        });
    });
    (0, vitest_1.describe)('POST /api/sessions', () => {
        (0, vitest_1.it)('creates new session', async () => {
            const sessionData = {
                acceptedAxioms: ['test-axiom-1'],
                rejectedAxioms: [],
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send(sessionData)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                id: vitest_1.expect.any(String),
                acceptedAxioms: ['test-axiom-1'],
                rejectedAxioms: [],
                exploredConnections: [],
                createdAt: vitest_1.expect.any(String),
                updatedAt: vitest_1.expect.any(String),
            });
        });
        (0, vitest_1.it)('creates session with default empty arrays', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({})
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                acceptedAxioms: [],
                rejectedAxioms: [],
            });
        });
    });
    (0, vitest_1.describe)('GET /api/sessions/:id', () => {
        (0, vitest_1.it)('retrieves existing session', async () => {
            // First create a session
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ acceptedAxioms: ['test-axiom-1'] });
            const sessionId = createResponse.body.id;
            // Then retrieve it
            const response = await (0, supertest_1.default)(app)
                .get(`/api/sessions/${sessionId}`)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                id: sessionId,
                acceptedAxioms: ['test-axiom-1'],
            });
        });
        (0, vitest_1.it)('returns 404 for non-existent session', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/sessions/non-existent')
                .expect(404);
            (0, vitest_1.expect)(response.body).toEqual({
                error: 'Session not found',
            });
        });
    });
    (0, vitest_1.describe)('PUT /api/sessions/:id', () => {
        (0, vitest_1.it)('updates existing session', async () => {
            // First create a session
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ acceptedAxioms: ['test-axiom-1'] });
            const sessionId = createResponse.body.id;
            // Then update it
            const updateData = {
                acceptedAxioms: ['test-axiom-1', 'test-axiom-2'],
                rejectedAxioms: ['test-axiom-3'],
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/sessions/${sessionId}`)
                .send(updateData)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                id: sessionId,
                acceptedAxioms: ['test-axiom-1', 'test-axiom-2'],
                rejectedAxioms: ['test-axiom-3'],
                updatedAt: vitest_1.expect.any(String),
            });
        });
    });
    (0, vitest_1.describe)('POST /api/snapshots', () => {
        (0, vitest_1.it)('creates snapshot from session', async () => {
            // First create a session
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ acceptedAxioms: ['test-axiom-1'] });
            const sessionId = createResponse.body.id;
            // Then create a snapshot
            const snapshotData = {
                title: 'Test Snapshot',
                description: 'A test snapshot',
                sessionId,
                isPublic: true,
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/snapshots')
                .send(snapshotData)
                .expect(200);
            (0, vitest_1.expect)(response.body).toMatchObject({
                id: vitest_1.expect.any(String),
                title: 'Test Snapshot',
                description: 'A test snapshot',
                axioms: ['test-axiom-1'],
                createdAt: vitest_1.expect.any(String),
            });
        });
        (0, vitest_1.it)('returns 404 for non-existent session', async () => {
            const snapshotData = {
                title: 'Test Snapshot',
                sessionId: 'non-existent',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/snapshots')
                .send(snapshotData)
                .expect(404);
            (0, vitest_1.expect)(response.body).toEqual({
                error: 'Session not found',
            });
        });
    });
});

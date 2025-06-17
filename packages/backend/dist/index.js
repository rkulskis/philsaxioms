"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const yaml_loader_1 = require("./yaml-loader");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Enable CORS and JSON parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Set up YAML data loader
const dataPath = path_1.default.join(__dirname, '../../../data');
const dataLoader = new yaml_loader_1.YamlDataLoader(dataPath);
dataLoader.onDataChange(() => {
    console.log('Data files changed - cache invalidated');
});
// Register API routes
app.use((0, routes_1.createRoutes)(dataLoader));
// Serve static frontend files from "public" directory
const staticDir = path_1.default.join(__dirname, 'public');
if (fs_1.default.existsSync(staticDir)) {
    app.use(express_1.default.static(staticDir));
    // Catch-all route for React Router (only for non-API paths)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api'))
            return res.status(404).json({ error: 'Not found' });
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
else {
    console.warn('⚠️  Static frontend directory does not exist:', staticDir);
}
// Optional root API info
app.get('/api', (req, res) => {
    res.json({
        message: 'PhilsAxioms API Server',
        version: '1.0.0',
        endpoints: {
            graph: '/api/graph',
            questionnaire: '/api/questionnaire',
            axioms: '/api/axioms/:id',
            axiomsByCategory: '/api/axioms/category/:category',
            connections: '/api/axioms/:id/connections',
            sessions: '/api/sessions',
            health: '/api/health'
        }
    });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 PhilsAxioms server running at http://localhost:${PORT}`);
    console.log(`📁 Data path: ${dataPath}`);
    if (fs_1.default.existsSync(staticDir)) {
        console.log(`🌐 Serving static frontend from: ${staticDir}`);
    }
});
// Graceful shutdown
const shutdown = () => {
    console.log('🛑 Shutdown signal received, cleaning up...');
    dataLoader.close();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

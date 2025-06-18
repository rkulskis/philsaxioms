"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArgument = exports.isAxiom = void 0;
// Type guards for checking node types
const isAxiom = (node) => node.edges.length === 0;
exports.isAxiom = isAxiom;
const isArgument = (node) => node.edges.length > 0;
exports.isArgument = isArgument;
//# sourceMappingURL=types.js.map
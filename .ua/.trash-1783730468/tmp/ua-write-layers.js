'use strict';
const fs = require('fs');
const d = require('/Users/sahilladhania/Desktop/Memorang Assignment/edpath/.ua/intermediate/architecture-input.json');

const meta = {
  'layer:frontend-ui': ['Frontend UI', 'Next.js App Router pages, the landing/quiz/plan/summary/shell widgets, shadcn UI primitives, React hooks, client lib helpers, and view-model types for the EdPath learner experience.'],
  'layer:copilot-bridge': ['CopilotKit-LangGraph Bridge', 'The CoAgent wiring that connects the React frontend to the LangGraph agent - the backend CopilotKit Runtime endpoint plus the web-side Copilot provider and shared state bridge.'],
  'layer:agent-core': ['Agent Teaching Workflow Core', 'The deterministic LangGraph teaching graph - nodes, edges, state annotation, prompts, and agent lib driving the Plan, Approve, Quiz loop, and Summarize flow with code-owned control flow.'],
  'layer:backend-api': ['Backend API & Ingestion', 'The Express host, PDF upload/clean/extract ingestion, the start route/service, and initial-state assembly that bootstrap a lesson before handing off to the agent.'],
  'layer:evals': ['Evals & Test Harness', 'The Vitest and LangSmith evaluation harness that scores agent nodes (plan, MCQ, grading, hints, summary) against PDF-grounded fixtures and assist-firewall/quality assertions.'],
  'layer:shared-packages': ['Shared Contracts & Packages', 'Cross-cutting monorepo packages - Zod schema contracts, branded ID/Phase/CoAgent-state types, and design tokens - serving as the single source of truth for both ends.'],
  'layer:config': ['Configuration', 'Build, tooling, and environment configuration - package/tsconfig manifests, Vitest/ESLint/PostCSS/Next configs, shared tsconfig presets, and env examples across all workspaces.'],
  'layer:documentation': ['Documentation', 'Reference architecture docs, per-directory READMEs, agent rule files, and design/assets notes that document EdPath workflow, boundaries, and locked decisions.'],
};
const order = ['layer:frontend-ui', 'layer:copilot-bridge', 'layer:agent-core', 'layer:backend-api', 'layer:evals', 'layer:shared-packages', 'layer:config', 'layer:documentation'];
const layers = {};
order.forEach(k => layers[k] = []);

function classify(n) {
  const p = n.filePath, t = n.type;
  if (t === 'config') return 'layer:config';
  if (t === 'document') return 'layer:documentation';
  const isBridge = /^apps\/edpath-web\/components\/copilot\//.test(p) || p === 'apps/edpath-web/lib/copilot.ts' || /^apps\/edpath-backend\/src\/copilot\//.test(p);
  if (isBridge) return 'layer:copilot-bridge';
  if (/^apps\/edpath-backend\/src\/agent\//.test(p)) return 'layer:agent-core';
  if (/^apps\/edpath-backend\/src\/evals\//.test(p)) return 'layer:evals';
  if (/^apps\/edpath-backend\//.test(p)) return 'layer:backend-api';
  if (/^apps\/edpath-web\//.test(p)) return 'layer:frontend-ui';
  if (/^packages\//.test(p)) return 'layer:shared-packages';
  return 'layer:backend-api';
}
d.fileNodes.forEach(n => layers[classify(n)].push(n.id));
const out = order.map(id => ({ id, name: meta[id][0], description: meta[id][1], nodeIds: layers[id] }));
fs.writeFileSync('/Users/sahilladhania/Desktop/Memorang Assignment/edpath/.ua/intermediate/layers.json', JSON.stringify(out, null, 2));
const total = out.reduce((a, l) => a + l.nodeIds.length, 0);
console.log('Wrote ' + out.length + ' layers; total nodes ' + total + '/' + d.fileNodes.length);
out.forEach(l => console.log('  ' + String(l.nodeIds.length).padStart(3) + '  ' + l.name));

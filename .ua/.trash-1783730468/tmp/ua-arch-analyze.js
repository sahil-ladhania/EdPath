#!/usr/bin/env node
'use strict';

const fs = require('fs');

function fail(msg) { process.stderr.write(String(msg) + '\n'); process.exit(1); }

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) fail('Usage: node ua-arch-analyze.js <input.json> <output.json>');

let data;
try { data = JSON.parse(fs.readFileSync(inPath, 'utf8')); }
catch (e) { fail('Failed to read/parse input: ' + e.message); }

const fileNodes = data.fileNodes || [];
const importEdges = data.importEdges || [];
const allEdges = data.allEdges || [];

const nodeById = new Map();
fileNodes.forEach(n => nodeById.set(n.id, n));
const idSet = new Set(fileNodes.map(n => n.id));

// ---- Common prefix computation over directory segments ----
function dirSegments(fp) {
  const parts = fp.split('/');
  parts.pop(); // remove filename
  return parts;
}
const allDirSegs = fileNodes.map(n => dirSegments(n.filePath));
let commonPrefix = [];
if (allDirSegs.length) {
  commonPrefix = allDirSegs[0].slice();
  for (const segs of allDirSegs) {
    let i = 0;
    while (i < commonPrefix.length && i < segs.length && commonPrefix[i] === segs[i]) i++;
    commonPrefix = commonPrefix.slice(0, i);
    if (!commonPrefix.length) break;
  }
}
const prefixLen = commonPrefix.length;

// ---- A. Directory Grouping ----
const directoryGroups = {};
const fileToGroup = new Map();
function groupOf(fp) {
  const segs = dirSegments(fp);
  const rest = segs.slice(prefixLen);
  if (rest.length === 0) return '(root)';
  return rest[0];
}
fileNodes.forEach(n => {
  const g = groupOf(n.filePath);
  (directoryGroups[g] = directoryGroups[g] || []).push(n.id);
  fileToGroup.set(n.id, g);
});

// ---- B. Node Type Grouping ----
const nodeTypeGroups = {};
fileNodes.forEach(n => { (nodeTypeGroups[n.type] = nodeTypeGroups[n.type] || []).push(n.id); });

// ---- C. Import Adjacency (fan-in/fan-out) ----
const fanOut = {}, fanIn = {};
fileNodes.forEach(n => { fanOut[n.id] = 0; fanIn[n.id] = 0; });
importEdges.forEach(e => {
  if (idSet.has(e.source) && idSet.has(e.target)) {
    fanOut[e.source]++; fanIn[e.target]++;
  }
});

// ---- D. Cross-Category Dependency Analysis (allEdges) ----
const crossMap = new Map();
allEdges.forEach(e => {
  const s = nodeById.get(e.source), t = nodeById.get(e.target);
  if (!s || !t) return;
  if (s.type === t.type) return; // cross-category only
  const key = s.type + '|' + t.type + '|' + e.type;
  crossMap.set(key, (crossMap.get(key) || 0) + 1);
});
const crossCategoryEdges = [];
for (const [key, count] of crossMap) {
  const [fromType, toType, edgeType] = key.split('|');
  crossCategoryEdges.push({ fromType, toType, edgeType, count });
}
crossCategoryEdges.sort((a, b) => b.count - a.count);

// ---- E. Inter-Group Import Frequency ----
const interMap = new Map();
importEdges.forEach(e => {
  const gs = fileToGroup.get(e.source), gt = fileToGroup.get(e.target);
  if (gs == null || gt == null || gs === gt) return;
  const key = gs + '|' + gt;
  interMap.set(key, (interMap.get(key) || 0) + 1);
});
const interGroupImports = [];
for (const [key, count] of interMap) {
  const [from, to] = key.split('|');
  interGroupImports.push({ from, to, count });
}
interGroupImports.sort((a, b) => b.count - a.count);

// ---- F. Intra-Group Import Density ----
const intraGroupDensity = {};
Object.keys(directoryGroups).forEach(g => { intraGroupDensity[g] = { internalEdges: 0, totalEdges: 0, density: 0 }; });
importEdges.forEach(e => {
  const gs = fileToGroup.get(e.source), gt = fileToGroup.get(e.target);
  if (gs == null || gt == null) return;
  if (gs === gt) { intraGroupDensity[gs].internalEdges++; intraGroupDensity[gs].totalEdges++; }
  else { intraGroupDensity[gs].totalEdges++; intraGroupDensity[gt].totalEdges++; }
});
Object.keys(intraGroupDensity).forEach(g => {
  const d = intraGroupDensity[g];
  d.density = d.totalEdges ? +(d.internalEdges / d.totalEdges).toFixed(3) : 0;
});

// ---- G. Directory Pattern Matching ----
const dirPatterns = [
  [['routes','api','controllers','endpoints','handlers'], 'api'],
  [['services','core','lib','domain','logic'], 'service'],
  [['models','db','data','persistence','repository','entities'], 'data'],
  [['components','views','pages','ui','layouts','screens'], 'ui'],
  [['middleware','plugins','interceptors','guards'], 'middleware'],
  [['utils','helpers','common','shared','tools'], 'utility'],
  [['config','constants','env','settings'], 'config'],
  [['__tests__','test','tests','spec','specs'], 'test'],
  [['types','interfaces','schemas','contracts','dtos'], 'types'],
  [['hooks'], 'hooks'],
  [['store','state','reducers','actions','slices'], 'state'],
  [['assets','static','public'], 'assets'],
  [['migrations'], 'data'],
  [['management','commands'], 'config'],
  [['templatetags'], 'utility'],
  [['signals'], 'service'],
  [['serializers'], 'api'],
  [['cmd'], 'entry'],
  [['internal'], 'service'],
  [['pkg'], 'utility'],
  [['dto','request','response'], 'types'],
  [['entity'], 'data'],
  [['controller'], 'api'],
  [['routers'], 'api'],
  [['composables'], 'service'],
  [['blueprints'], 'api'],
  [['mailers','jobs','channels'], 'service'],
  [['bin'], 'entry'],
  [['docs','documentation','wiki'], 'documentation'],
  [['deploy','deployment','infra','infrastructure'], 'infrastructure'],
  [['.github','.gitlab','.circleci'], 'ci-cd'],
  [['k8s','kubernetes','helm','charts'], 'infrastructure'],
  [['terraform','tf'], 'infrastructure'],
  [['docker'], 'infrastructure'],
  [['sql','database','schema'], 'data'],
  [['evals','eval'], 'test'],
  [['agent'], 'service'],
  [['copilot'], 'service'],
  [['features'], 'api'],
];
const dirPatternMap = new Map();
dirPatterns.forEach(([names, label]) => names.forEach(n => { if (!dirPatternMap.has(n)) dirPatternMap.set(n, label); }));

function fileLevelPattern(fp, name) {
  const lname = name.toLowerCase();
  if (/\.test\.|\.spec\.|\.contract-test\./.test(name) || /^test_.*\.py$/.test(name) ||
      /_test\.go$/.test(name) || /Test\.java$/.test(name) || /_spec\.rb$/.test(name) ||
      /Test\.php$/.test(name) || /Tests\.cs$/.test(name)) return 'test';
  if (/\.d\.ts$/.test(name)) return 'types';
  if (/\.(graphql|gql|proto)$/.test(name)) return 'types';
  if (/\.sql$/.test(name)) return 'data';
  if (/\.(md|rst|mdx)$/.test(lname)) return 'documentation';
  if (name === 'Dockerfile' || /^docker-compose\./.test(name)) return 'infrastructure';
  if (/\.(tf|tfvars)$/.test(name)) return 'infrastructure';
  if (name === 'Makefile') return 'infrastructure';
  if (name === 'Jenkinsfile' || name === '.gitlab-ci.yml') return 'ci-cd';
  return null;
}

const patternMatches = {};
Object.keys(directoryGroups).forEach(g => {
  const key = g.toLowerCase();
  if (dirPatternMap.has(g)) patternMatches[g] = dirPatternMap.get(g);
  else if (dirPatternMap.has(key)) patternMatches[g] = dirPatternMap.get(key);
});

// per-file pattern (useful for flat groups / non-code)
const filePatterns = {};
fileNodes.forEach(n => {
  const p = fileLevelPattern(n.filePath, n.name);
  if (p) filePatterns[n.id] = p;
});

// ---- H. Deployment Topology ----
const infraFiles = [];
let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;
fileNodes.forEach(n => {
  const fp = n.filePath, nm = n.name;
  if (nm === 'Dockerfile' || /^Dockerfile\./.test(nm)) { hasDockerfile = true; infraFiles.push(fp); }
  else if (/^docker-compose\./.test(nm) || nm === 'docker-compose.yml' || nm === 'docker-compose.yaml') { hasCompose = true; infraFiles.push(fp); }
  else if (/\.(tf|tfvars)$/.test(nm)) { hasTerraform = true; infraFiles.push(fp); }
  else if (/(^|\/)(k8s|kubernetes|helm|charts)(\/|$)/.test(fp)) { hasK8s = true; infraFiles.push(fp); }
  else if (/\.github\/workflows\//.test(fp) || nm === '.gitlab-ci.yml' || nm === 'Jenkinsfile') { hasCI = true; infraFiles.push(fp); }
});
const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles };

// ---- I. Data Pipeline Detection ----
const dataPipeline = { schemaFiles: [], migrationFiles: [], dataModelFiles: [], apiHandlerFiles: [] };
fileNodes.forEach(n => {
  const fp = n.filePath, nm = n.name.toLowerCase();
  const tags = (n.tags || []).map(t => t.toLowerCase());
  if (/\.(sql|graphql|gql|proto|prisma)$/.test(nm) || /schema/.test(nm)) dataPipeline.schemaFiles.push(fp);
  if (/(^|\/)migrations?(\/|$)/.test(fp)) dataPipeline.migrationFiles.push(fp);
  if (/(^|\/)models?(\/|$)/.test(fp) || tags.includes('model') || tags.includes('data-model')) dataPipeline.dataModelFiles.push(fp);
  if (tags.includes('api-handler') || tags.includes('route') || tags.includes('controller') || /(^|\/)(routes|api|controllers|features)(\/|$)/.test(fp)) dataPipeline.apiHandlerFiles.push(fp);
});

// ---- J. Documentation Coverage ----
const docNodeGroups = new Set();
fileNodes.forEach(n => {
  if (n.type === 'document' || /\.(md|rst|mdx)$/i.test(n.name)) docNodeGroups.add(fileToGroup.get(n.id));
});
const allGroups = Object.keys(directoryGroups);
const groupsWithDocs = allGroups.filter(g => docNodeGroups.has(g));
const undocumentedGroups = allGroups.filter(g => !docNodeGroups.has(g));
const docCoverage = {
  groupsWithDocs: groupsWithDocs.length,
  totalGroups: allGroups.length,
  coverageRatio: allGroups.length ? +(groupsWithDocs.length / allGroups.length).toFixed(2) : 0,
  undocumentedGroups
};

// ---- K. Dependency Direction ----
const pairNet = new Map(); // unordered pair -> {a,b,ab,ba}
interGroupImports.forEach(({ from, to, count }) => {
  const key = [from, to].sort().join('||');
  let rec = pairNet.get(key);
  if (!rec) { const [a, b] = [from, to].sort(); rec = { a, b, ab: 0, ba: 0 }; pairNet.set(key, rec); }
  if (from === rec.a) rec.ab += count; else rec.ba += count;
});
const dependencyDirection = [];
for (const rec of pairNet.values()) {
  if (rec.ab === rec.ba) continue;
  if (rec.ab > rec.ba) dependencyDirection.push({ dependent: rec.a, dependsOn: rec.b });
  else dependencyDirection.push({ dependent: rec.b, dependsOn: rec.a });
}

// ---- fileStats ----
const filesPerGroup = {};
Object.keys(directoryGroups).forEach(g => filesPerGroup[g] = directoryGroups[g].length);
const nodeTypeCounts = {};
Object.keys(nodeTypeGroups).forEach(t => nodeTypeCounts[t] = nodeTypeGroups[t].length);

const result = {
  scriptCompleted: true,
  commonPrefix: commonPrefix.join('/'),
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  filePatterns,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: { totalFileNodes: fileNodes.length, filesPerGroup, nodeTypeCounts },
  fileFanIn: fanIn,
  fileFanOut: fanOut
};

try { fs.writeFileSync(outPath, JSON.stringify(result, null, 2)); }
catch (e) { fail('Failed to write output: ' + e.message); }
process.exit(0);

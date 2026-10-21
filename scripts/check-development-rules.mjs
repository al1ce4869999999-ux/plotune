import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const policyPath = 'DEVELOPMENT_RULES.md';
const workflowPath = '.github/workflows/development-governance.yml';
assert.ok(existsSync(policyPath), 'Development policy is missing');
assert.ok(existsSync(workflowPath), 'Development governance workflow is missing');
const policy = readFileSync(policyPath, 'utf8');
const workflow = readFileSync(workflowPath, 'utf8');
for (const heading of [
  'Roles and execution order',
  'GitHub and release safety',
  'Composition architecture and musical invariants',
  'Verification gates',
  'Mobile feedback and result handoff',
  'Issue logging and progress',
  'Before reporting completion',
  'CI-enforced invariants'
]) assert.ok(policy.includes('## ' + heading), 'Missing policy section: ' + heading);
for (const term of ['iPhone Safari', 'listening A/B', 'source commit', 'main', 'Codex']) {
  assert.ok(policy.includes(term), 'Missing policy requirement: ' + term);
}
assert.match(workflow, /pull_request:/, 'Governance checks must run on PRs');
assert.match(workflow, /push:/, 'Governance checks must run on branch pushes');
assert.match(workflow, /node scripts\/check-development-rules\.mjs/, 'Workflow must run governance checker');
console.log('plotune development governance checks passed');

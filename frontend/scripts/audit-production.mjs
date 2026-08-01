import { spawnSync } from 'node:child_process';

const acceptedAdvisories = new Map([
  [
    'GHSA-qwww-vcr4-c8h2',
    'React Router RSC actions are not used by this static Vite SPA; no patched React Router release exists yet.'
  ]
]);

const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32'
});

let report;
try {
  report = JSON.parse(audit.stdout || '{}');
} catch {
  process.stderr.write(audit.stderr || audit.stdout || 'Unable to parse npm audit output.\n');
  process.exit(1);
}

const blocked = [];
const accepted = new Map();

for (const [packageName, vulnerability] of Object.entries(report.vulnerabilities || {})) {
  for (const advisory of vulnerability.via || []) {
    if (!advisory || typeof advisory !== 'object' || !['high', 'critical'].includes(advisory.severity)) continue;
    const id = String(advisory.url || '').split('/').pop();
    if (acceptedAdvisories.has(id)) {
      accepted.set(id, acceptedAdvisories.get(id));
    } else {
      blocked.push({ packageName, id, title: advisory.title, severity: advisory.severity });
    }
  }
}

if (blocked.length > 0) {
  process.stderr.write(`Unaccepted production vulnerabilities:\n${JSON.stringify(blocked, null, 2)}\n`);
  process.exit(1);
}

for (const [id, reason] of accepted) {
  process.stdout.write(`Accepted ${id}: ${reason}\n`);
}
process.stdout.write('No unaccepted high or critical production vulnerabilities.\n');

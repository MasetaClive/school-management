const { spawnSync } = require('node:child_process');

// Next.js 15.5.24 pins PostCSS 8.4.31 exactly. npm's only available fix is a
// breaking Next.js 16 upgrade, so these specific advisories are temporarily
// allowlisted. Keep this list narrow: a new advisory, package path, or high /
// critical vulnerability must fail CI.
const NEXT_POSTCSS_PATH = 'node_modules/next/node_modules/postcss';
const ALLOWED_POSTCSS_ADVISORIES = new Set([1117015, 1124252, 1130709, 1139510]);

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['audit', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Unable to run npm audit: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('npm audit did not return a valid JSON report.');
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

if (!report.vulnerabilities || typeof report.vulnerabilities !== 'object') {
  console.error('npm audit did not return vulnerability data.');
  process.exit(1);
}

const blockingVulnerabilities = Object.entries(report.vulnerabilities).filter(([, vulnerability]) =>
  vulnerability.severity === 'high' || vulnerability.severity === 'critical',
);

const unexpectedVulnerabilities = blockingVulnerabilities.filter(([name, vulnerability]) => {
  if (name !== 'postcss' || vulnerability.nodes?.length !== 1 || vulnerability.nodes[0] !== NEXT_POSTCSS_PATH) {
    return true;
  }

  return !Array.isArray(vulnerability.via) || vulnerability.via.some((advisory) =>
    typeof advisory !== 'object' || advisory === null || !ALLOWED_POSTCSS_ADVISORIES.has(advisory.source),
  );
});

if (unexpectedVulnerabilities.length > 0) {
  console.error('Unexpected HIGH or CRITICAL npm audit vulnerabilities found:');
  for (const [name, vulnerability] of unexpectedVulnerabilities) {
    console.error(`- ${name} (${vulnerability.severity})`);
  }
  process.exit(1);
}

if (blockingVulnerabilities.length > 0) {
  console.warn('Temporarily excepted: Next.js 15.5.24 pins PostCSS 8.4.31.');
  console.warn('The supported npm remediation requires a breaking upgrade to Next.js 16.');
}

console.log('npm audit passed: no unexcepted HIGH or CRITICAL vulnerabilities found.');

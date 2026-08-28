# Security hygiene

`npm run security:audit` runs the repository's dependency audit in CI. It fails
for every HIGH or CRITICAL vulnerability except four explicitly identified
PostCSS advisories (`1117015`, `1124252`, `1130709`, and `1139510`) when they
occur only at `node_modules/next/node_modules/postcss`.

Next.js 15.5.24 pins that nested dependency to PostCSS 8.4.31 exactly. npm
reports that the supported remediation is an upgrade to Next.js 16, which is a
breaking major upgrade and is intentionally out of scope for this repository.
The direct PostCSS dependency is already on the patched 8.5.26 release.

This exception is deliberately narrow and temporary. The audit wrapper fails
for any new advisory, a changed dependency path, or any other HIGH/CRITICAL
vulnerability. Remove the exception when the application can safely move to a
Next.js version that no longer pins the vulnerable PostCSS release.

/* global process */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.idea', '.vscode', 'ultimate_bible']);
const IGNORE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']);
const IGNORE_FILES = new Set(['.env', '.env.local', '.env.development', '.env.production']);

const PATTERNS = [
  { name: 'AI key', regex: /vck_[A-Za-z0-9]{20,}/g },
  { name: 'DATABASE_URL inline credential', regex: /DATABASE_URL\s*=\s*["']?postgres(?:ql)?:\/\/[^"'\s]+/gi },
  { name: 'JWT secret hardcoded', regex: /JWT_SECRET\s*=\s*["'][^"']{16,}["']/g }
];

const findings = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (IGNORE_FILES.has(entry.name)) continue;
    if (entry.name.startsWith('.env.')) continue;
    if (IGNORE_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    if (relPath.endsWith('.md')) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(content)) {
        findings.push({ file: relPath, type: pattern.name });
      }
    }
  }
}

walk(ROOT);

if (findings.length > 0) {
  console.error('Secret check failed. Potential sensitive values found:');
  for (const item of findings) {
    console.error(`- [${item.type}] ${item.file}`);
  }
  process.exit(1);
}

console.log('Secret check passed.');

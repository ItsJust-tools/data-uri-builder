import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dockerfile = readFileSync(join(process.cwd(), 'Dockerfile'), 'utf-8');
const lines = dockerfile.split(/\r?\n/);

/** Collect a Dockerfile instruction including its backslash continuations. */
function instruction(name: string): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (!new RegExp(`^\\s*${name}\\b`, 'i').test(line)) continue;
    const parts: string[] = [line];
    while ((parts[parts.length - 1] ?? '').trimEnd().endsWith('\\') && i + 1 < lines.length) {
      parts.push(lines[++i] ?? '');
    }
    return parts.join('\n');
  }
  return null;
}

describe('Dockerfile', () => {
  it('defines a HEALTHCHECK for the runtime container', () => {
    const healthcheck = instruction('HEALTHCHECK');
    expect(healthcheck).not.toBeNull();
    expect(healthcheck).toMatch(/--interval=/);
    expect(healthcheck).toMatch(/--timeout=/);
    expect(healthcheck).toMatch(/--retries=/);
    expect(healthcheck).toMatch(/--start-period=/);
    expect(healthcheck).toMatch(/\bCMD\b/);
    expect(healthcheck).toContain('127.0.0.1:3000');
    // `localhost` resolves to ::1 first for BusyBox wget while the server binds
    // HOSTNAME=0.0.0.0 (IPv4 only), so probing it would never pass.
    expect(healthcheck).not.toContain('localhost');
  });

  it('runs the health check after the server port is exposed', () => {
    const exposeIndex = lines.findIndex((line) => /^\s*EXPOSE\s+3000\s*$/i.test(line));
    const healthcheckIndex = lines.findIndex((line) => /^\s*HEALTHCHECK\b/i.test(line));
    expect(exposeIndex).toBeGreaterThanOrEqual(0);
    expect(healthcheckIndex).toBeGreaterThan(exposeIndex);
  });
});

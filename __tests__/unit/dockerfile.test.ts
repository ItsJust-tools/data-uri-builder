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

  it('creates a dedicated non-root user and group', () => {
    expect(dockerfile).toMatch(/addgroup\s+--system\s+--gid\s+1001\s+nodejs/);
    expect(dockerfile).toMatch(/adduser\s+--system\s+--uid\s+1001\s+nextjs/);
  });

  it('switches the runtime container to the non-root user', () => {
    const userIndex = lines.findIndex((line) => /^\s*USER\s+nextjs\s*$/i.test(line));
    expect(userIndex).toBeGreaterThanOrEqual(0);

    // USER must appear after the non-root user is created, and the final CMD
    // must be reached while still running as that user.
    const addUserIndex = lines.findIndex((line) =>
      /adduser\s+--system\s+--uid\s+1001\s+nextjs/.test(line)
    );
    expect(addUserIndex).toBeGreaterThanOrEqual(0);
    expect(userIndex).toBeGreaterThan(addUserIndex);

    const rootUserIndex = lines.findIndex((line) => /^\s*USER\s+(root|0)\s*$/i.test(line));
    expect(rootUserIndex).toBe(-1);
  });

  it('does not run the server as root', () => {
    const runnerStart = lines.findIndex((line) => /^\s*FROM\s+\S+\s+AS\s+runner\s*$/i.test(line));
    expect(runnerStart).toBeGreaterThanOrEqual(0);
    const runnerLines = lines.slice(runnerStart);
    expect(runnerLines.some((line) => /^\s*USER\s+nextjs\s*$/i.test(line))).toBe(true);
  });

  it('hands runtime paths to the non-root user', () => {
    expect(dockerfile).toMatch(/--chown=nextjs:nodejs/);
  });
});

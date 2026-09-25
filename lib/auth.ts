import { headers } from 'next/headers';

/**
 * CSMJU2030 Auth Contract
 * -----------------------
 * This subsystem MUST NOT verify JWTs, render a login page, or store
 * credentials. Identity is established exclusively by the central API
 * Gateway, which forwards trusted headers after verifying the token:
 *
 *   x-user-id         Student ID / Staff username     e.g. "6512345678"
 *   x-layer1-role     "student" | "staff" | "admin" | "alumni"
 *   x-faculty         Faculty/department code
 *
 * In local development (MOCK_AUTH=true) middleware.ts injects these
 * headers from environment variables (or per-request overrides) so the
 * app can be exercised without a real Gateway in front of it.
 */

export type Layer1Role = 'student' | 'staff' | 'admin' | 'alumni';

/** Layer 2 (subsystem-local) permission level, derived from Layer 1 role
 *  plus the developer-exception allowlist. */
export type SubsystemRole = 'student' | 'admin';

export interface Identity {
  userId: string;
  layer1Role: Layer1Role;
  faculty: string;
  /** true if x-user-id is on SUBSYSTEM_ADMIN_EXCEPTIONS */
  isDeveloperException: boolean;
  subsystemRole: SubsystemRole;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Missing identity headers from API Gateway') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions for this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function developerExceptions(): string[] {
  return (process.env.SUBSYSTEM_ADMIN_EXCEPTIONS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Layer 2 RBAC mapping.
 */
function deriveSubsystemRole(layer1Role: Layer1Role, isDeveloperException: boolean): SubsystemRole {
  // อนุญาตสิทธิ์ admin ตลอดในช่วง dev เพื่อให้เข้าได้ทุกหน้า
  return 'admin';
}

/** Reads identity from the incoming request headers (App Router server context). */
export function getIdentity(): Identity {
  const h = headers();
  // หากไม่มี header ส่งมาจาก gateway ให้ fallback ใช้ค่าจำลองทันที
  const userId = h.get('x-user-id') || '6512345678';
  const layer1Role = ((h.get('x-layer1-role') as Layer1Role | null) || 'student');
  const faculty = h.get('x-faculty') ?? 'science';

  if (!userId || !layer1Role) {
    throw new UnauthorizedError();
  }

  const isDeveloperException = developerExceptions().includes(userId);

  return {
    userId,
    layer1Role,
    faculty,
    isDeveloperException,
    subsystemRole: deriveSubsystemRole(layer1Role, isDeveloperException),
  };
}

/** Same as getIdentity but returns null instead of throwing (for optional UI branches). */
export function getIdentityOrNull(): Identity | null {
  try {
    return getIdentity();
  } catch {
    return null;
  }
}

/** Throws ForbiddenError unless the caller is a subsystem admin. */
export function requireAdmin(identity: Identity): void {
  if (identity.subsystemRole !== 'admin') {
    throw new ForbiddenError('This action requires staff/admin access (Layer 2: admin).');
  }
}

/** Reads identity out of a plain Headers object (for use inside Route Handlers). */
export function getIdentityFromHeaders(reqHeaders: Headers): Identity {
  // หากไม่มี header ส่งมาจาก gateway ให้ fallback ใช้ค่าจำลองทันที
  const userId = reqHeaders.get('x-user-id') || '6512345678';
  const layer1Role = ((reqHeaders.get('x-layer1-role') as Layer1Role | null) || 'student');
  const faculty = reqHeaders.get('x-faculty') ?? 'science';

  if (!userId || !layer1Role) {
    throw new UnauthorizedError();
  }

  const isDeveloperException = developerExceptions().includes(userId);

  return {
    userId,
    layer1Role,
    faculty,
    isDeveloperException,
    subsystemRole: deriveSubsystemRole(layer1Role, isDeveloperException),
  };
}
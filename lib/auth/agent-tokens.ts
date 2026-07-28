// ═══════════════════════════════════════════════════════════════════════
// Agent Token Authentication
// Validates scoped API tokens for agent access
// ═══════════════════════════════════════════════════════════════════════

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { AgentToken } from '@/lib/types';

export interface AgentAuthResult {
  valid: boolean;
  token?: AgentToken;
  error?: string;
}

// ── Hash a token (SHA-256) ────────────────────────────────────────────

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Validate a bearer token from the Authorization header ─────────────

export async function validateAgentToken(
  authHeader: string | null
): Promise<AgentAuthResult> {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return { valid: false, error: 'Invalid Authorization header format' };
  }

  const token = match[1];
  const hash = await hashToken(token);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agent_tokens')
    .select('*')
    .eq('token_hash', hash)
    .is('revoked_at', null)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or revoked token' };
  }

  const agentToken = data as AgentToken;

  // Check expiry
  if (agentToken.expires_at && new Date(agentToken.expires_at) < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  // Update last_used_at
  await supabase
    .from('agent_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', agentToken.id);

  return { valid: true, token: agentToken };
}

// ── Check if agent has a specific scope ───────────────────────────────

export function hasScope(token: AgentToken, scope: string): boolean {
  return token.scopes.includes(scope);
}

// ── Check if agent has access to a project ────────────────────────────

export function hasProjectAccess(token: AgentToken, projectId: string): boolean {
  return token.project_ids.includes(projectId);
}

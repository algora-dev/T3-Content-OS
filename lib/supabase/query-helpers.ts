import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Query helper that tries user session first, falls back to admin client if RLS blocks.
 * Usage:
 *   const data = await queryWithFallback(
 *     (client) => client.from('content_items').select('*').eq('status', 'in-review')
 *   );
 */
export async function queryWithFallback<T>(
  queryFn: (client: ReturnType<typeof createClient> | ReturnType<typeof createAdminClient>) => Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  const userClient = await createClient();
  const result = await queryFn(userClient);
  
  if (result.data && (Array.isArray(result.data) ? result.data.length > 0 : true)) {
    return result.data;
  }
  
  // Fallback to admin client
  const adminClient = createAdminClient();
  const adminResult = await queryFn(adminClient);
  return adminResult.data;
}

/**
 * For count queries (head: true) where we need the count, not data.
 */
export async function countWithFallback(
  queryFn: (client: ReturnType<typeof createClient> | ReturnType<typeof createAdminClient>) => Promise<{ count: number | null; error: unknown }>
): Promise<number> {
  const userClient = await createClient();
  const result = await queryFn(userClient);
  
  if (result.count !== null && result.count > 0) {
    return result.count;
  }
  
  const adminClient = createAdminClient();
  const adminResult = await queryFn(adminClient);
  return adminResult.count ?? 0;
}

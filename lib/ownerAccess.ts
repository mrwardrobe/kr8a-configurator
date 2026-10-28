/** The workspace has no production login yet. Never expose it on the live site.
 * Vercel preview access is protected by the project's existing deployment SSO. */
export function ownerWorkspaceAvailable(environment: string | undefined, nodeEnvironment: string | undefined): boolean {
  return environment === 'preview' || (!environment && nodeEnvironment === 'development');
}

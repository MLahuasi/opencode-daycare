/** Technical port for constructing a database client implementation. */
export interface DatabaseClientProvider<TClient> {
  /** Creates a configured database client. */
  createClient(): TClient;
}

type RequiredQuery = { data: unknown; isPending: boolean; isError: boolean };

/** A failed required request must remain retryable even if another request is paused/pending. */
export function requiredQueryState(queries: readonly RequiredQuery[]) {
  if (queries.some((query) => query.data === undefined && query.isError)) return "error";
  if (queries.some((query) => query.data === undefined && query.isPending)) return "loading";
  return "ready";
}

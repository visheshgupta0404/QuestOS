/**
 * Structured HTTP error thrown by API route handlers.
 * The `status` field maps directly to the HTTP response status code.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Idempotency identifiers are not authentication secrets.
export function createRequestId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (part) => {
    const value = Math.floor(Math.random() * 16);
    return (part === "x" ? value : (value & 3) | 8).toString(16);
  });
}

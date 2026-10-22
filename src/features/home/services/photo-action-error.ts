export class PhotoActionError extends Error {
  constructor(
    public readonly code:
      | "permission"
      | "sharingUnavailable"
      | "nativeBuildRequired",
  ) {
    super(code);
  }
}

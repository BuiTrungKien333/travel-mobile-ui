export class PhotoActionError extends Error {
  constructor(public readonly code: "permission" | "sharingUnavailable") {
    super(code);
  }
}

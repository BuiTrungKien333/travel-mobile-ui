const prefix = /^Tôi đi [^\n]*? \d+ ngày, mỗi ngày từ ((?:[01]\d|2[0-3]):[0-5]\d) đến ((?:[01]\d|2[0-3]):[0-5]\d)\. Nhịp độ (thong thả|năng động|vừa phải)\.\n\n([\s\S]*)$/;

/** Restore the form context that this app prepends to a natural-language request. */
export function planningTextContext(text?: string | null) {
  const match = text?.match(prefix);
  if (!match) return { text: text ?? "", start: undefined, end: undefined, pace: undefined };
  const pace: "RELAXED" | "ACTIVE" | "BALANCED" = match[3] === "thong thả" ? "RELAXED" : match[3] === "năng động" ? "ACTIVE" : "BALANCED";
  return { text: match[4], start: match[1], end: match[2], pace };
}

import { z } from "zod";
const count = z.number().int().nonnegative().safe();

const pagination = {
  page: count,
  size: count.min(1).max(100),
  totalElements: count,
};

export const accountSchema = z.object({
  id: z.guid(),
  fullName: z.string(),
  email: z.email(),
  role: z.enum(["USER", "ADMIN", "GUEST"]),
  locked: z.boolean(),
  verified: z.boolean(),
  version: count,
  createdAt: z.iso.datetime(),
});

export const accountPageSchema = z.object({
  ...pagination,
  content: z.array(accountSchema).max(100),
});

export const eventPageSchema = z.object({
  ...pagination,
  content: z
    .array(
      z.object({
        id: z.guid(),
        actorId: z.guid(),
        targetId: z.guid(),
        actorEmail: z.email(),
        targetEmail: z.email(),
        oldRole: z.enum(["USER", "ADMIN", "GUEST"]),
        newRole: z.enum(["USER", "ADMIN", "GUEST"]),
        wasLocked: z.boolean(),
        isLocked: z.boolean(),
        createdAt: z.iso.datetime(),
      }),
    )
    .max(100),
});

export const catalogPageSchema = z.object({
  ...pagination,
  content: z
    .array(
      z.object({
        id: z.guid(),
        name: z.string(),
        sourceUrl: z.string(),
        verificationScope: z.string(),
        approved: z.boolean(),
        version: count.min(1),
      }),
    )
    .max(100),
});

export type Account = z.infer<typeof accountSchema>;

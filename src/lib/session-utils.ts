// lib/session-utils.ts
import crypto from "crypto";

export const hashSessionToken = (raw: string) =>
    crypto.createHash("sha256").update(raw).digest("hex");
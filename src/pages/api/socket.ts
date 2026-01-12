import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import type { Server as NetServer } from "http";
import jwt from "jsonwebtoken";

import UserModel from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

type AuthedUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type ChatMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  ts: number;
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: IOServer;
    };
  };
};

const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

// In-memory message store (sufficient for now; replace with DB later).
const messagesByConversation = new Map<string, ChatMessage[]>();

function getConversationId(a: string, b: string) {
  return [a, b].sort().join(":");
}

function parseCookies(cookieHeader: string | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = decodeURIComponent(part.slice(0, eq).trim());
    const v = decodeURIComponent(part.slice(eq + 1).trim());
    out[k] = v;
  }
  return out;
}

function assertJwtSecret(): jwt.Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Server misconfigured (missing JWT secret)");
  return secret;
}

function safeText(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: true,
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      try {
        const cookies = parseCookies(socket.request.headers.cookie);
        const token = cookies["auth-token"];
        if (!token) return next(new Error("Unauthorized"));

        const decoded = jwt.verify(token, assertJwtSecret(), {
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        }) as jwt.JwtPayload;

        const userId = decoded?.userId?.toString?.();
        if (!userId) return next(new Error("Unauthorized"));

        await connectToDatabase();
        const user = await UserModel.findById(userId).select("_id name avatarUrl").lean();
        if (!user?._id) return next(new Error("Unauthorized"));

        const authed: AuthedUser = {
          id: user._id.toString(),
          name: user.name,
          avatarUrl: user.avatarUrl,
        };
        socket.data.user = authed;
        socket.join(`user:${authed.id}`);

        return next();
      } catch {
        return next(new Error("Unauthorized"));
      }
    });

    io.on("connection", (socket) => {
      const me = socket.data.user as AuthedUser | undefined;
      if (!me?.id) return;

      socket.on(
        "chat:history",
        (
          payload: { withUserId?: string; limit?: number },
          ack?: (messages: ChatMessage[]) => void
        ) => {
          const withUserId = safeText(payload?.withUserId);
          const limitRaw = typeof payload?.limit === "number" ? payload.limit : 50;
          const limit = Math.max(1, Math.min(200, limitRaw));
          if (!withUserId) return ack?.([]);

          const cid = getConversationId(me.id, withUserId);
          const all = messagesByConversation.get(cid) ?? [];
          const sliced = all.slice(Math.max(0, all.length - limit));
          ack?.(sliced);
        }
      );

      socket.on(
        "chat:message",
        async (
          payload: { toUserId?: string; text?: string },
          ack?: (result: { ok: true; message: ChatMessage } | { ok: false; error: string }) => void
        ) => {
          const toUserId = safeText(payload?.toUserId);
          const text = safeText(payload?.text);

          if (!toUserId) return ack?.({ ok: false, error: "Missing recipient" });
          if (!text) return ack?.({ ok: false, error: "Message is empty" });
          if (text.length > 2000) return ack?.({ ok: false, error: "Message too long" });
          if (toUserId === me.id) return ack?.({ ok: false, error: "Cannot message yourself" });

          const ts = Date.now();
          const msg: ChatMessage = {
            id: `${me.id}-${ts}-${Math.random().toString(16).slice(2)}`,
            fromUserId: me.id,
            toUserId,
            text,
            ts,
          };

          const cid = getConversationId(me.id, toUserId);
          const existing = messagesByConversation.get(cid) ?? [];
          existing.push(msg);
          messagesByConversation.set(cid, existing);

          // Deliver to both users (sender + recipient) via per-user rooms.
          io.to(`user:${me.id}`).emit("chat:message", msg);
          io.to(`user:${toUserId}`).emit("chat:message", msg);

          ack?.({ ok: true, message: msg });
        }
      );
    });

    res.socket.server.io = io;
  }

  // Important: do not respond with JSON here. The Socket.IO server attaches to the underlying
  // Node HTTP server and will handle Engine.IO transport requests for this path.
  res.end();
}


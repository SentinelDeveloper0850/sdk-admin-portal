import { NextResponse } from "next/server";

// Lightweight health endpoint used by the client connectivity monitor.
// Intentionally does not depend on the database.
export async function GET() {
  return NextResponse.json(
    { ok: true, ts: new Date().toISOString() },
    {
      status: 200,
      headers: {
        // Avoid caching so the client can use this for reachability checks.
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}


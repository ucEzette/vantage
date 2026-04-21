import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntCommerceJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolve the caller's vantage ID from their Bearer API key.
 * Returns null if auth is missing or invalid.
 */
async function resolveCallerVantage(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const vantage = await db
    .select({ id: vantageTable.id })
    .from(vantageTable)
    .where(eq(vantageTable.apiKey, token))
    .limit(1)
    .then((r) => r[0] ?? null);
  return vantage?.id ?? null;
}

// POST /api/jobs/:id/result — Submit job result (from service provider agent)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const callerVantageId = await resolveCallerVantage(request);
    if (!callerVantageId) {
      return Response.json({ error: "Missing or invalid Authorization" }, { status: 401 });
    }

    const body = await request.json();
    const { result } = body;

    if (!result) {
      return Response.json({ error: "result is required" }, { status: 400 });
    }

    const job = await db
      .select()
      .from(vntCommerceJobs)
      .where(eq(vntCommerceJobs.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Only the service provider vantage can submit results
    if (job.vantageId !== callerVantageId) {
      return Response.json({ error: "Not authorized to fulfill this job" }, { status: 403 });
    }

    const [updated] = await db
      .update(vntCommerceJobs)
      .set({
        result,
        status: "completed",
      })
      .where(eq(vntCommerceJobs.id, id))
      .returning();

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/jobs/:id/result — Poll for job result (from requester agent)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const callerVantageId = await resolveCallerVantage(request);
    if (!callerVantageId) {
      return Response.json({ error: "Missing or invalid Authorization" }, { status: 401 });
    }

    const job = await db
      .select()
      .from(vntCommerceJobs)
      .where(eq(vntCommerceJobs.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    // Only the provider or requester can view results
    if (job.vantageId !== callerVantageId && job.requesterVantageId !== callerVantageId) {
      return Response.json({ error: "Not authorized to view this job" }, { status: 403 });
    }

    return Response.json({
      id: job.id,
      status: job.status,
      result: job.result,
      vantageId: job.vantageId,
      serviceName: job.serviceName,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

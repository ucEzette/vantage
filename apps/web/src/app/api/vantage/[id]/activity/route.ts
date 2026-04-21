import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntActivities } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyAgentApiKey } from "@/lib/auth";

// GET /api/vantage/:id/activity — Get activities
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const vantage = await db
      .select({ id: vantageTable.id })
      .from(vantageTable)
      .where(eq(vantageTable.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage) {
      return Response.json({ error: "Vantage not found" }, { status: 404 });
    }

    const activities = await db
      .select()
      .from(vntActivities)
      .where(eq(vntActivities.vantageId, id))
      .orderBy(desc(vntActivities.createdAt))
      .limit(50);

    return Response.json(activities);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/vantage/:id/activity — Report activity (from Local Agent)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const auth = await verifyAgentApiKey(request, id);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { type, content, channel, status } = body;

    const validTypes = ["post", "research", "reply", "commerce", "approval"];
    const validStatuses = ["completed", "pending", "failed"];

    if (!type || !content || !channel) {
      return Response.json(
        { error: "type, content, channel are required" },
        { status: 400 }
      );
    }

    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (status && !validStatuses.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const [activity] = await db
      .insert(vntActivities)
      .values({
        vantageId: id,
        type,
        content,
        channel,
        status: status ?? "completed",
      })
      .returning();

    return Response.json(activity, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { searchPeople } from "@/lib/teams-directory"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() || ""
  if (query.length < 2) {
    return NextResponse.json({ people: [] })
  }

  try {
    const people = await searchPeople(session.user.email, query)
    return NextResponse.json({ people })
  } catch (error) {
    console.error("People search error:", error)
    return NextResponse.json({ people: [] })
  }
}

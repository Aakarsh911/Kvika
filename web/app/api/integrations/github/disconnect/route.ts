import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Provider } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { cache, cacheKeys } from "@/lib/redis"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const email = (session as any)?.user?.email as string | undefined
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.integration.deleteMany({
    where: { userId: user.id, provider: Provider.GITHUB },
  })
  await cache.del(cacheKeys.integrations(user.id))

  return NextResponse.json({ ok: true })
}

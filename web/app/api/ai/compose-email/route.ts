import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { composeEmailDraft, composeEmailInputSchema } from '@/lib/compose-email'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input = composeEmailInputSchema.parse(await request.json())
    const draft = await composeEmailDraft(input)

    return NextResponse.json({
      body: draft.body,
      subject: draft.subject,
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid compose email request', details: error.flatten() },
        { status: 400 }
      )
    }

    console.error('Compose email error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}


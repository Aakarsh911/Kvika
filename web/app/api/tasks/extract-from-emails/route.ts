import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Provider } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { extractTasksFromEmailsBatch } from '@/lib/gemini'
import { deleteCache } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { requireAIConsent } from '@/lib/ai-consent'
import { getAIProvider } from '@/lib/ai'

/**
 * Extract actionable tasks from emails using AI (Gemini)
 * POST /api/tasks/extract-from-emails
 * 
 * Scalable implementation:
 * - Single API call for all emails (batch processing)
 * - Proper error handling and logging
 * - Duplicate prevention
 * - Rich metadata storage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check AI consent
    try {
      await requireAIConsent(session.user.email)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'AI consent required',
          code: 'AI_CONSENT_REQUIRED',
          message: 'You must grant consent to use AI features. Please enable AI features in Settings.'
        },
        { status: 403 }
      )
    }

    const startTime = Date.now()
    console.log(`🤖 [Task Extraction] Starting for user ${user.id}`)

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Fetch emails from Gmail using delta sync if historyId exists
    let allEmails: any[] = []
    let gmailHistoryId: string | null = null
    let newGmailHistoryId: string | null = null
    let newOutlookDeltaLink: string | null = null
    
    const googleIntegration = await prisma.integration.findFirst({
      where: { userId: user.id, provider: Provider.GOOGLE }
    })

    if (googleIntegration && !forceRefresh) {
      const data = (googleIntegration.data as Record<string, any>) || {}
      gmailHistoryId = data.gmailHistoryId || null
    }

    let gmailResOk = false

    if (gmailHistoryId) {
      console.log(`📧 [Gmail] Running incremental history sync (historyId: ${gmailHistoryId})...`)
      try {
        const gmailRes = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/emails/sync?historyId=${gmailHistoryId}`, {
          headers: { Cookie: request.headers.get('cookie') || '' }
        })
        if (gmailRes.ok) {
          const gmailData = await gmailRes.json()
          const gmailEmails = (gmailData.emails || []).map((e: any) => ({
            id: e.id,
            subject: e.subject,
            bodyPreview: e.bodyPreview || e.snippet || '',
            from: e.from,
            provider: 'gmail' as const,
            webLink: e.htmlLink || e.webLink,
          }))
          allEmails.push(...gmailEmails)
          newGmailHistoryId = gmailData.historyId || null
          gmailResOk = true
          console.log(`📧 [Gmail] Sync complete: fetched ${gmailEmails.length} new email(s)`)
        } else if (gmailRes.status === 400) {
          console.warn(`⚠️ [Gmail] historyId ${gmailHistoryId} expired. Falling back to full fetch...`)
        }
      } catch (gmailError) {
        console.error('❌ [Gmail] Error during sync fetch:', gmailError)
      }
    }

    if (!gmailResOk) {
      console.log(`📧 [Gmail] Running initial email fetch (forceRefresh: ${forceRefresh})...`)
      try {
        const gmailUrl = forceRefresh
          ? `${process.env.NEXTAUTH_URL}/api/gmail/emails?forceRefresh=true`
          : `${process.env.NEXTAUTH_URL}/api/gmail/emails`
        const gmailRes = await fetch(gmailUrl, {
          headers: { Cookie: request.headers.get('cookie') || '' }
        })
        if (gmailRes.ok) {
          const gmailData = await gmailRes.json()
          const gmailEmails = (gmailData.emails || []).map((e: any) => ({
            id: e.id,
            subject: e.subject,
            bodyPreview: e.bodyPreview || e.snippet || '',
            from: e.from,
            provider: 'gmail' as const,
            webLink: e.htmlLink || e.webLink,
          }))
          allEmails.push(...gmailEmails)
          newGmailHistoryId = gmailData.historyId || null
          console.log(`📧 [Gmail] Initial fetch complete: fetched ${gmailEmails.length} email(s)`)
        }
      } catch (gmailError) {
        console.error('❌ [Gmail] Error during full fetch:', gmailError)
      }
    }

    // Fetch emails from Outlook (this endpoint now automatically tracks deltaLink in DB)
    try {
      const outlookUrl = forceRefresh
        ? `${process.env.NEXTAUTH_URL}/api/outlook/emails/delta?deltaLink=clear&persist=false`
        : `${process.env.NEXTAUTH_URL}/api/outlook/emails/delta?persist=false`
      const outlookRes = await fetch(outlookUrl, {
        headers: { Cookie: request.headers.get('cookie') || '' }
      })
      
      if (outlookRes.ok) {
        const outlookData = await outlookRes.json()
        const outlookEmails = (outlookData.emails || []).map((e: any) => ({
          id: e.id,
          subject: e.subject || '(No subject)',
          bodyPreview: e.bodyPreview || '',
          from: {
            name: e.from?.emailAddress?.name || 'Unknown',
            address: e.from?.emailAddress?.address || 'unknown@email.com'
          },
          provider: 'outlook' as const,
          webLink: e.webLink,
        }))
        allEmails.push(...outlookEmails)
        newOutlookDeltaLink = outlookData.deltaLink || null
        console.log(`📧 [Outlook] Fetched ${outlookEmails.length} emails`)
      }
    } catch (outlookError) {
      console.error('❌ [Outlook] Error fetching emails:', outlookError)
    }

    if (allEmails.length === 0) {
      console.log('⚠️ [Task Extraction] No emails found')
      return NextResponse.json({
        success: true,
        extracted: 0,
        created: 0,
        emailsProcessed: 0,
        message: 'No emails found to process'
      })
    }

    console.log(`📊 [Task Extraction] Processing ${allEmails.length} emails total`)

    // Split emails into batches of 20
    function chunkArray<T>(arr: T[], size: number): T[][] {
      const res: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
      }
      return res;
    }

    const BATCH_SIZE = 10;
    const emailBatches = chunkArray(allEmails, BATCH_SIZE);
    let extractionResults: any[] = [];

    for (const batch of emailBatches) {
      const batchIdx = emailBatches.indexOf(batch) + 1;
      const providerName = getAIProvider() === 'gemini' ? 'Gemini' : 'Bedrock';
      console.log(`📥 [Task Extraction] Sending batch of ${batch.length} emails (batch ${batchIdx}/${emailBatches.length}) to ${providerName} batch extractor...`)
      const batchResults = await extractTasksFromEmailsBatch(batch);
      console.log(`📤 [Task Extraction] Batch results returned ${batchResults.length} email(s) with actionable tasks for batch ${batchIdx}/${emailBatches.length}:`, JSON.stringify(batchResults.map(r => ({ emailId: r.emailId, tasksCount: r.tasks?.length })), null, 2))
      extractionResults = extractionResults.concat(batchResults);
    }

    console.log(`✅ [AI] Found actionable items in ${extractionResults.length} emails`)

    // Create tasks in database
    const createdTasks: any[] = []
    const skippedDuplicates: any[] = []
    const errors: any[] = []

    for (const result of extractionResults) {
      for (const task of result.tasks) {
        try {
          // Check if task already exists
          const existingTask = await prisma.task.findFirst({
            where: {
              userId: user.id,
              source: 'EMAIL_AI',
              sourceId: result.emailId,
              title: task.title, // Also check title to avoid duplicates from same email
            },
          })

          if (existingTask) {
            console.log(`⏭️  [Duplicate] Skipping: "${task.title}" from email ${result.emailId}`)
            skippedDuplicates.push({ emailId: result.emailId, taskTitle: task.title })
            continue
          }

          // Create new task with rich metadata
          const newTask = await prisma.task.create({
            data: {
              userId: user.id,
              title: task.title,
              description: task.description,
              status: 'To Do',
              priority: task.priority,
              source: 'EMAIL_AI', // Dedicated source for AI-extracted tasks
              sourceId: result.emailId,
              url: result.webLink, // Link to original email
              sourceData: {
                emailSubject: result.emailSubject,
                from: result.from,
                provider: result.provider,
                confidence: result.confidence,
                category: task.category,
                extractedAt: new Date().toISOString(),
              },
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
            },
          })

          createdTasks.push(newTask)
          console.log(`✅ [Created] "${task.title}" (${task.priority} priority)`)
        } catch (error) {
          console.error(`❌ [Error] Failed to create task from email ${result.emailId}:`, error)
          errors.push({
            emailId: result.emailId,
            taskTitle: task.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // -------------------------------------------------------------
    // TRANSACTIONAL STEP: Update database with advanced sync states
    // ONLY executed if Gemini batch extraction completes without throwing
    // -------------------------------------------------------------
    
    // 1. Update Gmail sync state
    if (googleIntegration && newGmailHistoryId && newGmailHistoryId !== gmailHistoryId) {
      const data = (googleIntegration.data as Record<string, any>) || {}
      await prisma.integration.update({
        where: { id: googleIntegration.id },
        data: {
          data: {
            ...data,
            gmailHistoryId: newGmailHistoryId
          }
        }
      })
      console.log(`💾 [Sync State] Persisted new Gmail historyId to database: ${newGmailHistoryId}`)
    }

    // 2. Update Outlook sync state
    const microsoftIntegration = await prisma.integration.findFirst({
      where: { userId: user.id, provider: Provider.MICROSOFT }
    })
    if (microsoftIntegration && newOutlookDeltaLink) {
      const data = (microsoftIntegration.data as Record<string, any>) || {}
      if (newOutlookDeltaLink !== data.outlookMailDeltaLink) {
        await prisma.integration.update({
          where: { id: microsoftIntegration.id },
          data: {
            data: {
              ...data,
              outlookMailDeltaLink: newOutlookDeltaLink
            }
          }
        })
        console.log(`💾 [Sync State] Persisted new Outlook deltaLink to database: ${newOutlookDeltaLink}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`⏱️  [Task Extraction] Completed in ${duration}ms`)
    console.log(`📈 [Summary] ${createdTasks.length} created, ${skippedDuplicates.length} duplicates, ${errors.length} errors`)

    // Invalidate cache so new tasks appear immediately
    const cacheKey = `tasks:${user.id}`
    await deleteCache(cacheKey)
    console.log(`🗑️  [Cache] Invalidated cache for user ${user.id}`)

    return NextResponse.json({
      success: true,
      emailsProcessed: allEmails.length,
      emailsWithTasks: extractionResults.length,
      tasksCreated: createdTasks.length,
      duplicatesSkipped: skippedDuplicates.length,
      errors: errors.length,
      duration: `${duration}ms`,
      tasks: createdTasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        provider: (t.sourceData as any)?.provider,
        emailSubject: (t.sourceData as any)?.emailSubject,
      })),
    })

  } catch (error) {
    console.error('❌ [Task Extraction] Fatal error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

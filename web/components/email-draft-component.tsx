'use client'

import { useState } from 'react'
import { Send, Edit3, X, Check, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { PersonRecipientInput, type PersonRecipientValue } from '@/components/person-recipient-input'

interface EmailDraftProps {
  emailId?: string // Optional for new emails
  to?: string // For new emails (resolved email)
  toName?: string // Display name when resolved from directory
  provider: 'gmail' | 'outlook'
  subject: string
  draftContent: string
  isNewEmail?: boolean // Flag to indicate new email vs reply
  onClose: () => void
  onSent?: () => void
}

export default function EmailDraftComponent({
  emailId,
  to,
  toName,
  provider,
  subject,
  draftContent,
  isNewEmail = false,
  onClose,
  onSent
}: EmailDraftProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(draftContent)
  const [editedSubject, setEditedSubject] = useState(subject)
  const [recipient, setRecipient] = useState<PersonRecipientValue>({
    name: toName || to || '',
    email: to || null,
    matched: !!to,
  })
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (isNewEmail && !recipient.email) {
      toast({
        title: 'Recipient required',
        description: 'Pick someone from suggestions or enter their email address.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      const endpoint = isNewEmail ? '/api/mail/send-new' : '/api/mail/send-reply'
      const body = isNewEmail
        ? { to: recipient.email, subject: editedSubject, body: editedContent, provider }
        : { emailId, provider, replyContent: editedContent }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      toast({
        title: '✅ Email Sent!',
        description: isNewEmail ? 'Your email has been sent successfully.' : 'Your reply has been sent successfully.',
      })

      onSent?.()
      onClose()
    } catch (error) {
      console.error('Failed to send email:', error)
      toast({
        title: '❌ Failed to Send',
        description: 'Could not send the email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="rounded-2xl glass-strong border-2 border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
            <h3 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {isNewEmail ? 'New Email Draft' : 'AI Draft Reply'}
            </h3>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              READY
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 p-0"
              title={isEditing ? 'Preview' : 'Edit'}
            >
              {isEditing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Recipient (for new emails) & Subject */}
        {isNewEmail && (
          <>
            <div className="mb-2">
              <label className="text-xs text-muted-foreground font-medium block mb-1">To:</label>
              <PersonRecipientInput
                value={recipient}
                onChange={setRecipient}
                inputClassName="glass-medium"
              />
            </div>
            {!recipient.matched && recipient.name && (
              <p className="mb-2 text-[11px] text-amber-600">
                Pick a match from suggestions so we know where to send this.
              </p>
            )}
          </>
        )}
        
        {isEditing && isNewEmail ? (
          <div className="mb-2">
            <label className="text-xs text-muted-foreground font-medium block mb-1">Subject:</label>
            <Input
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="h-7 text-xs glass-medium"
              placeholder="Email subject"
            />
          </div>
        ) : (
          <div className="text-xs">
            <span className="text-muted-foreground font-medium">{isNewEmail ? 'Subject: ' : 'Re: '}</span>
            <span className="font-semibold">{isNewEmail ? editedSubject : subject}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[200px] glass-medium font-medium text-sm resize-none focus:glass-strong"
            placeholder="Edit your reply..."
          />
        ) : (
          <div className="min-h-[200px] p-4 rounded-lg glass-light">
            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
              {editedContent}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {provider.toUpperCase()}
          </Badge>
          {isEditing && (
            <span className="text-xs text-muted-foreground">
              {editedContent.length} characters
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSending}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !editedContent.trim() || (isNewEmail && (!recipient.email || !editedSubject.trim()))}
            size="sm"
            className="h-8 px-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/30"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-2" />
                {isNewEmail ? 'Send Email' : 'Send Reply'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


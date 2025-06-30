import { NextRequest } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '../../../../../lib/prisma'
import { logOperation, logError } from '../../../../../lib/utils'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Get the headers
  const headerPayload = req.headers
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    logError('clerk-webhook', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    logOperation('clerk-webhook', `Processing user.created event for user ${evt.data.id}`)

    try {
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || '',
          name: `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim() || null,
        },
      })

      logOperation('clerk-webhook', `Successfully created user ${evt.data.id}`)
    } catch (error) {
      logError('clerk-webhook', error, { clerkId: evt.data.id })
      return new Response('Error creating user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}

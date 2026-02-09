import { clerkClient } from "@clerk/express";

//middleware to check userId and premiumPlan

export const auth = async (req, res, next) => {
  try {
    // Match server's validation: only treat as configured when keys look valid
    const hasClerkKeys =
      typeof process.env.CLERK_PUBLISHABLE_KEY === 'string' &&
      process.env.CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
      typeof process.env.CLERK_SECRET_KEY === 'string' &&
      process.env.CLERK_SECRET_KEY.startsWith('sk_')

    // In dev (no valid Clerk keys), fall back to a stub user id
    const userId = req.auth?.userId || (hasClerkKeys ? undefined : 'dev-user')
    const has = req.auth?.has || (() => false)

    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    const hasPremiumPlan = Boolean(has({ plan: 'premium' }))

    let freeUsage = 0
    if (hasClerkKeys) {
      
      const user = await clerkClient.users.getUser(userId)
      freeUsage = Number(user?.privateMetadata?.free_usage || 0)
      if (!hasPremiumPlan && freeUsage >= 10) {
        return res.status(403).json({ error: 'Free plan limit reached' })
      }
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free'
    req.free_usage = freeUsage
    return next()
  } catch (error) {
    return res.json({ success: false, error: error.message })
  }
}

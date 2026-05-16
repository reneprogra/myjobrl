import * as admin from 'firebase-admin'

export function getAdminApp(): admin.app.App {
  if (admin.apps.length) return admin.apps[0]!

  let serviceAccount: object

  // In production (Vercel), read from environment variable.
  // Locally, fall back to the json file on disk.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    serviceAccount = JSON.parse(
      readFileSync(path.join(process.cwd(), 'firebase-service-account.json'), 'utf-8')
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  })
}

export { admin }

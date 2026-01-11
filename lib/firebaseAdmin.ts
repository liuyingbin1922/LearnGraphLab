import admin from 'firebase-admin';

function getServiceAccount() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing env GCP_SERVICE_ACCOUNT_JSON');
  return JSON.parse(raw);
}

export const firebaseAdminApp =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
        projectId: process.env.GCP_PROJECT_ID,
      });

export const db = admin.firestore();

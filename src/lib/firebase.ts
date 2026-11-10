/**
 * SENA LUXE - Firebase Initialization & Error Handling
 * Connects to Firestore Database and Firebase Authentication
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: Passing firestoreDatabaseId is mandatory for Named Databases */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connection verification health check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or unreachable:', error.message);
      return false;
    }
    // Document might not exist which is fine, as long as it reaches server
    return true;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


/**
 * Upload a product screen-recording video to Firebase Storage.
 * Only authenticated administrators can upload; Storage rules enforce authorization.
 */
export async function uploadProductVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('動画をアップロードするには管理者ログインが必要です。');
  }
  if (!file.type.startsWith('video/')) {
    throw new Error('動画ファイルを選択してください。');
  }
  const maxBytes = 200 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('動画は200MB以下にしてください。');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90) || 'recording.mp4';
  const objectRef = ref(storage, `product-videos/${auth.currentUser.uid}/${Date.now()}-${safeName}`);
  const task = uploadBytesResumable(objectRef, file, {
    contentType: file.type || 'video/mp4',
    cacheControl: 'public,max-age=31536000,immutable',
  });
  return await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

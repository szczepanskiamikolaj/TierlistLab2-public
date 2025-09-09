import { z } from 'zod'; 

const envSchema = z.object({
  FIREBASE_ADMIN_TYPE: z.string().min(1),
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_PRIVATE_KEY_ID: z.string().min(1),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_ID: z.string().min(1),
  FIREBASE_ADMIN_AUTH_URI: z.string().min(1),
  FIREBASE_ADMIN_TOKEN_URI: z.string().min(1),
  FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_CERT_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().min(1),
  FIREBASE_ADMIN_STORAGE_BUCKET: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  throw new Error(`Invalid environment variables: ${env.error.format()}`);
}

export const {
  FIREBASE_ADMIN_TYPE,
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_PRIVATE_KEY_ID,
  FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_CLIENT_ID,
  FIREBASE_ADMIN_AUTH_URI,
  FIREBASE_ADMIN_TOKEN_URI,
  FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL,
  FIREBASE_ADMIN_CLIENT_CERT_URL,
  NEXT_PUBLIC_SITE_URL,
  FIREBASE_ADMIN_STORAGE_BUCKET,
  REDIS_URL,
} = env.data;

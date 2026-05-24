import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AUDIO_ANALYSIS_URL: z.string().url().optional(),
  AUDIO_ANALYSIS_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

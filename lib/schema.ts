import { z } from 'zod';

export const TopicSchema = z.object({
  language: z.enum(['zh', 'en', 'mixed']).default('zh'),
  subject: z.string().min(1),
  gradeLevel: z.string().optional(),

  title: z.string().min(1),
  slug: z.string().min(1),

  summary: z.string().min(1),
  keyPoints: z.array(z.string()).min(3).max(8),
  commonMistakes: z.array(z.string()).min(1).max(6),

  prerequisites: z.array(z.string()).max(10).default([]),
  relatedTopics: z.array(z.string()).max(12).default([]),

  workedExamples: z
    .array(
      z.object({
        question: z.string().min(1),
        shortSolution: z.string().min(1),
      })
    )
    .min(1)
    .max(3),

  tags: z.array(z.string()).max(20).default([]),

  extractedQuestionText: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.7),
});

export type Topic = z.infer<typeof TopicSchema>;

export const MistakeSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1).default('anon'),

  createdAt: z.number(),
  updatedAt: z.number(),

  image: z.object({
    objectPath: z.string(),
    gsUri: z.string(),
    httpUrl: z.string().optional(),
    mimeType: z.string(),
  }),

  extractedQuestionText: z.string().optional(),

  topicSlug: z.string().optional(),
  topicId: z.string().optional(),
  topicTitle: z.string().optional(),

  parse: TopicSchema.optional(),
});

export type Mistake = z.infer<typeof MistakeSchema>;

import { z } from 'zod';

const commentContent = z.string().trim().min(1, 'Comment content is required').max(2_000);

export const createCommentSchema = z.object({ content: commentContent });
export const updateCommentSchema = z.object({ content: commentContent });

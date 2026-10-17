import { z } from 'zod';
import {
  departmentKindEnum,
  ticketCategoryEnum,
  ticketPriorityEnum,
  ticketStatusEnum,
} from '@/db/schema';

export const ticketInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  reporterName: z.string().trim().min(2).max(80),
  reporterEmail: z.string().trim().toLowerCase().pipe(z.email()),
  department: z.enum(departmentKindEnum.enumValues),
  category: z.enum(ticketCategoryEnum.enumValues),
  priority: z.enum(ticketPriorityEnum.enumValues),
});

export const ticketStatusSchema = z.enum(ticketStatusEnum.enumValues);

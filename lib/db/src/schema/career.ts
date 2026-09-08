import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const careerProfiles = pgTable("career_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  headline: text("headline").notNull(),
  education: text("education").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  targetRoles: jsonb("target_roles").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const careerDocuments = pgTable("career_documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  chunks: integer("chunks").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumeAnalyses = pgTable("resume_analyses", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  score: integer("score").notNull(),
  summary: text("summary").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
  missingSkills: jsonb("missing_skills").$type<unknown[]>().notNull().default([]),
  roleMatches: jsonb("role_matches").$type<unknown[]>().notNull().default([]),
  agentTrace: jsonb("agent_trace").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careerActivities = pgTable("career_activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCareerProfileSchema = createInsertSchema(careerProfiles);
export type CareerProfile = typeof careerProfiles.$inferSelect;
export type CareerDocument = typeof careerDocuments.$inferSelect;
export type ResumeAnalysis = typeof resumeAnalyses.$inferSelect;
export type CareerActivity = typeof careerActivities.$inferSelect;
-- Migration: Add organization support
-- Created for feature/organizations branch

-- Add active organization/team columns to session
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_team_id" text;

-- Create organization table
CREATE TABLE IF NOT EXISTS "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);

-- Create member table
CREATE TABLE IF NOT EXISTS "member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	"organization_id" text NOT NULL REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create invitation table
CREATE TABLE IF NOT EXISTS "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	"organization_id" text NOT NULL REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TYPE "public"."organization_type" AS ENUM('startup', 'investor', 'accelerator');--> statement-breakpoint
CREATE TYPE "public"."announcement_type" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."fraud_flag_status" AS ENUM('open', 'investigating', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."warning_type" AS ENUM('conduct', 'spam', 'fraud', 'policy');--> statement-breakpoint
CREATE TYPE "public"."profile_type" AS ENUM('founder', 'investor', 'talent');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('user_suspended', 'user_banned', 'user_verified', 'report_resolved', 'role_assigned');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('user', 'message', 'profile', 'content');--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"type" "organization_type" DEFAULT 'startup' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_toggles" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 100 NOT NULL,
	"description" text,
	"updated_by" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraud_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"flag_type" varchar(100) NOT NULL,
	"reason" text NOT NULL,
	"severity" integer DEFAULT 1 NOT NULL,
	"status" "fraud_flag_status" DEFAULT 'open' NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_by" varchar(255),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "moderation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"threshold" integer DEFAULT 70 NOT NULL,
	"action" varchar(80) DEFAULT 'flag_fraud' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "moderation_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "platform_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"type" "announcement_type" DEFAULT 'info' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_risk_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"risk_level" "risk_level" DEFAULT 'low' NOT NULL,
	"factors" text,
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_warnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"warning_type" "warning_type" NOT NULL,
	"message" text NOT NULL,
	"issued_by" varchar(255) NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"acknowledged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "founder_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"startup_name" varchar(255),
	"industry" varchar(100),
	"stage" varchar(50),
	"pitch_deck_url" text,
	"website_url" text,
	"linkedin_url" text,
	"bio" text,
	"tags" text[],
	"verified" boolean DEFAULT false NOT NULL,
	"verification_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"investor_type" varchar(50),
	"investment_range_min" numeric(15, 2),
	"investment_range_max" numeric(15, 2),
	"industries_of_interest" text[],
	"portfolio" text[],
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verification_document_url" text,
	"linkedin_url" text,
	"bio" text,
	"verified_at" timestamp,
	"verified_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"role" varchar(100),
	"title" varchar(100),
	"skills" text[],
	"experience_years" integer,
	"resume_url" text,
	"portfolio_url" text,
	"linkedin_url" text,
	"bio" text,
	"availability" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"target_user_id" varchar(255),
	"action" "action_type" NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"details" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"resource" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" varchar(255),
	"reported_user_id" varchar(255) NOT NULL,
	"report_type" "report_type" NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" varchar(255) NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "user_suspensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"suspended_by" varchar(255) NOT NULL,
	"suspended_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"lifted_at" timestamp,
	"lifted_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "active_team_id" text;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fraud_flags_user_id_idx" ON "fraud_flags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fraud_flags_status_idx" ON "fraud_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_announcements_active_idx" ON "platform_announcements" USING btree ("active");--> statement-breakpoint
CREATE INDEX "user_risk_profiles_risk_level_idx" ON "user_risk_profiles" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "user_warnings_user_id_idx" ON "user_warnings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "investor_verification_status_idx" ON "investor_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "permissions_resource_action_idx" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_reported_user_idx" ON "reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_suspensions_user_id_idx" ON "user_suspensions" USING btree ("user_id");
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"original_url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL,
	"extraction_label" text NOT NULL,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text NOT NULL,
	"notes" text NOT NULL,
	"ppt_content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_version" varchar(32) NOT NULL,
	"extraction_quality" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(120) NOT NULL,
	"picture" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

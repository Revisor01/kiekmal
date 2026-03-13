CREATE TYPE "public"."event_category" AS ENUM('gottesdienst', 'konzert', 'jugend', 'gemeindeleben', 'lesung', 'diskussion', 'andacht');--> statement-breakpoint
CREATE TYPE "public"."event_source" AS ENUM('manual', 'churchdesk');--> statement-breakpoint
CREATE TABLE "congregations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"website_url" text,
	"location" geometry(point),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"category" "event_category" NOT NULL,
	"congregation_id" uuid NOT NULL,
	"churchdesk_id" text,
	"source" "event_source" DEFAULT 'manual' NOT NULL,
	"image_url" text,
	"price" text,
	"registration_url" text,
	"bring_items" text,
	"persons" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_churchdesk_id_unique" UNIQUE("churchdesk_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_congregation_id_congregations_id_fk" FOREIGN KEY ("congregation_id") REFERENCES "public"."congregations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "congregations_location_gist_idx" ON "congregations" USING gist ("location");
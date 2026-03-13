import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  geometry,
} from "drizzle-orm/pg-core";

export const eventCategoryEnum = pgEnum("event_category", [
  "gottesdienst",
  "konzert",
  "jugend",
  "gemeindeleben",
  "lesung",
  "diskussion",
  "andacht",
]);

export const eventSourceEnum = pgEnum("event_source", ["manual", "churchdesk"]);

export const congregations = pgTable(
  "congregations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    websiteUrl: text("website_url"),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("congregations_location_gist_idx").using("gist", table.location)]
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  category: eventCategoryEnum("category").notNull(),
  congregationId: uuid("congregation_id")
    .notNull()
    .references(() => congregations.id),
  churchdeskId: text("churchdesk_id").unique(),
  source: eventSourceEnum("source").notNull().default("manual"),
  imageUrl: text("image_url"),
  price: text("price"),
  registrationUrl: text("registration_url"),
  bringItems: text("bring_items"),
  persons: text("persons"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

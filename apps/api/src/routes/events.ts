import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db/index.js";
import { events, congregations } from "../db/schema.js";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { EventListItemDTO } from "@prayback/types";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(100000).default(10000),
  category: z
    .enum([
      "gottesdienst",
      "konzert",
      "jugend",
      "gemeindeleben",
      "lesung",
      "diskussion",
      "andacht",
    ])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/events",
    {
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { lat, lon, radius, category, dateFrom, dateTo } = request.query;

      const conditions = [
        sql`ST_DWithin(
          ${congregations.location}::geography,
          ST_MakePoint(${lon}, ${lat})::geography,
          ${radius}
        )`,
      ];

      if (category) {
        conditions.push(eq(events.category, category));
      }
      if (dateFrom) {
        conditions.push(gte(events.startsAt, dateFrom));
      }
      if (dateTo) {
        conditions.push(lte(events.startsAt, dateTo));
      }

      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          startsAt: events.startsAt,
          endsAt: events.endsAt,
          category: events.category,
          congregationId: events.congregationId,
          imageUrl: events.imageUrl,
          source: events.source,
          price: events.price,
          registrationUrl: events.registrationUrl,
          persons: events.persons,
          address: congregations.address,
          lat: sql<number>`ST_Y(${congregations.location}::geometry)`,
          lon: sql<number>`ST_X(${congregations.location}::geometry)`,
        })
        .from(events)
        .innerJoin(congregations, eq(events.congregationId, congregations.id))
        .where(and(...conditions))
        .orderBy(events.startsAt);

      const result: EventListItemDTO[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString(),
        category: row.category,
        congregationId: row.congregationId,
        imageUrl: row.imageUrl ?? undefined,
        source: row.source,
        price: row.price ?? undefined,
        registrationUrl: row.registrationUrl ?? undefined,
        persons: row.persons ?? undefined,
        location: {
          lat: Number(row.lat),
          lon: Number(row.lon),
          address: row.address,
        },
      }));

      return reply.send(result);
    }
  );
};

export default eventsRoutes;

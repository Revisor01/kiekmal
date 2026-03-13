import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db/index.js";
import { events, congregations } from "../db/schema.js";
import { and, eq, gte, sql } from "drizzle-orm";
import type { CongregationDetailDTO, EventDTO } from "@prayback/types";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const congregationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/congregations/:id",
    {
      schema: {
        params: paramsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Congregation abrufen
      const congregationRows = await db
        .select({
          id: congregations.id,
          name: congregations.name,
          address: congregations.address,
          websiteUrl: congregations.websiteUrl,
          lat: sql<number>`ST_Y(${congregations.location}::geometry)`,
          lon: sql<number>`ST_X(${congregations.location}::geometry)`,
        })
        .from(congregations)
        .where(eq(congregations.id, id))
        .limit(1);

      if (congregationRows.length === 0) {
        return reply.status(404).send({ error: "Congregation not found" });
      }

      const congregation = congregationRows[0];

      // Kommende Events abrufen (startsAt >= jetzt, max 20, chronologisch)
      const now = new Date();
      const eventRows = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          startsAt: events.startsAt,
          endsAt: events.endsAt,
          category: events.category,
          congregationId: events.congregationId,
          imageUrl: events.imageUrl,
          source: events.source,
          price: events.price,
          registrationUrl: events.registrationUrl,
          bringItems: events.bringItems,
          persons: events.persons,
        })
        .from(events)
        .where(and(eq(events.congregationId, id), gte(events.startsAt, now)))
        .orderBy(events.startsAt)
        .limit(20);

      const eventDTOs: EventDTO[] = eventRows.map((row) => ({
        id: row.id,
        title: row.title,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString(),
        category: row.category,
        congregationId: row.congregationId,
        description: row.description ?? undefined,
        imageUrl: row.imageUrl ?? undefined,
        source: row.source,
        price: row.price ?? undefined,
        registrationUrl: row.registrationUrl ?? undefined,
        bringItems: row.bringItems ?? undefined,
        persons: row.persons ?? undefined,
        location: {
          lat: Number(congregation.lat),
          lon: Number(congregation.lon),
          address: congregation.address,
        },
      }));

      const result: CongregationDetailDTO = {
        id: congregation.id,
        name: congregation.name,
        address: congregation.address,
        websiteUrl: congregation.websiteUrl ?? undefined,
        location: {
          lat: Number(congregation.lat),
          lon: Number(congregation.lon),
        },
        events: eventDTOs,
      };

      return reply.send(result);
    }
  );
};

export default congregationsRoutes;

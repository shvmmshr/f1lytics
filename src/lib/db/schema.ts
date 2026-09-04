import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import type { Breakdown } from "@/lib/lockin/scoring";

export * from "./auth-schema";

/** One row per signed-in player; created by the auth user-create hook. */
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull().unique(),
  tier: text("tier", { enum: ["free", "supporter"] }).notNull().default("free"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A player's picks for one round. Rounds are keyed by race date, never round number. */
export const predictions = pgTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    raceDate: text("race_date").notNull(),
    pole: text("pole").notNull(),
    p1: text("p1").notNull(),
    p2: text("p2").notNull(),
    p3: text("p3").notNull(),
    fastestLap: text("fastest_lap").notNull(),
    marginMs: integer("margin_ms").notNull(),
    sprintWinner: text("sprint_winner"),
    shareId: text("share_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("predictions_user_round").on(t.userId, t.raceDate),
    index("predictions_round").on(t.raceDate),
  ],
);

/** Official outcome per round, filled phase by phase from Jolpica. */
export const roundResults = pgTable("round_results", {
  raceDate: text("race_date").primaryKey(),
  pole: text("pole"),
  p1: text("p1"),
  p2: text("p2"),
  p3: text("p3"),
  fastestLap: text("fastest_lap"),
  marginMs: integer("margin_ms"),
  sprintWinner: text("sprint_winner"),
  qualiSettledAt: timestamp("quali_settled_at", { withTimezone: true }),
  sprintSettledAt: timestamp("sprint_settled_at", { withTimezone: true }),
  raceSettledAt: timestamp("race_settled_at", { withTimezone: true }),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
});

/** Exactly-once guard: the settlement batch inserts here first and fails on conflict. */
export const settlements = pgTable(
  "settlements",
  {
    raceDate: text("race_date").notNull(),
    phase: text("phase", { enum: ["quali", "sprint", "race"] }).notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.raceDate, t.phase] })],
);

export const scores = pgTable(
  "scores",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    raceDate: text("race_date").notNull(),
    points: integer("points").notNull(),
    exactHits: integer("exact_hits").notNull(),
    breakdown: jsonb("breakdown").$type<Breakdown>().notNull(),
    tiebreakMs: integer("tiebreak_ms"),
    rank: integer("rank"),
    players: integer("players"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.raceDate] }), index("scores_round").on(t.raceDate)],
);

export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leagueMembers = pgTable(
  "league_members",
  {
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.leagueId, t.userId] }), index("league_members_user").on(t.userId)],
);

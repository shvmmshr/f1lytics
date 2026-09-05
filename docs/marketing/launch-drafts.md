# Launch drafts

Nothing here has been posted. Each block is a draft for you to edit and post yourself. Post the Show HN
on a weekday morning US time; post the X thread right after qualifying when the grid card is fresh.
Check r/formula1's self-promotion rules before posting there (they could not be verified from here).

## Show HN

**Title:** Show HN: F1lytics, an open-source F1 site with free live timing and a predictions game

**Text:**

I built F1lytics (https://f1lytics.com) over the 2026 season: standings, results, telemetry charts, a live
timing screen, and now a free predictions game called Lock In.

Things that might interest HN:

- Live timing comes from Formula 1's own SignalR Core hub, relayed as Server-Sent Events from a Node route
  on Vercel. The hub is unauthenticated for timing topics; the relay only connects inside a scheduled
  session window and drops out when F1's status file says it is offline.
- The homepage shows the live session through a one-shot snapshot endpoint cached at the CDN for ten
  seconds, so a thousand visitors cost one connection.
- Results reconcile two sources: OpenF1 publishes classifications minutes after a session, Jolpica hours
  later but with official points. Race date is the join key because Jolpica renumbers rounds after
  cancellations.
- Lock In settles from the official classification with one idempotent batch per phase; Neon's pooler
  drops session locks, so the exactly-once guard is a unique row, not an advisory lock.
- Stack: Next.js 16, React 19, Drizzle on Neon over HTTP, Better Auth. Zero infrastructure cost.

Source: https://github.com/shvmmshr/f1lytics

## Product Hunt

**Name:** F1lytics
**Tagline:** Formula 1, decoded: live timing, results, telemetry and a free predictions game
**Description:** A broadcast-style F1 site for the 2026 season. Follow live timing during sessions, dig into
lap charts and tyre strategies afterwards, and call pole, the podium and fastest lap before every race
weekend in Lock In. Free, open source, no ads.
**First comment:** Built solo. Data comes from public feeds, so results appear within minutes of the flag.
Lock In is the new bit: six sharp calls per weekend, leagues with friends, a share card when you called it.

## X thread (post after qualifying)

1/ Qualifying done. Grid card is up on F1lytics within minutes of the session: [link to /races/<slug>]
2/ If you think you know Sunday's podium, prove it. Lock In takes six calls per weekend: pole, P1, P2,
   P3, fastest lap and the winning margin. Free, no app. [link to /lockin]
3/ Leagues take one link. Start one, send it to the group chat, and every settled round updates the table.
4/ Everything is open source: [GitHub link]

## Reddit (r/F1Technical or r/formula1 if allowed)

**Title:** I built an open-source F1 live timing site, and it now has a free predictions game

**Body:** F1lytics reads Formula 1's public timing hub during sessions and shows positions, gaps, sectors
and tyres in a broadcast-style screen. After each session the results, lap charts and tyre strategies
come from OpenF1 and Jolpica. This week I added Lock In: call pole, the podium and fastest lap before
qualifying, then see who called it. Feedback on the timing screen especially welcome. [links]

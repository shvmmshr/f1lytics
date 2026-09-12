import type { CIRCUIT_FACTS } from "./facts";

interface CircuitGuide {
  kind: "Permanent circuit" | "Street circuit" | "Parkland circuit" | "Hybrid circuit";
  intro: string;
  sections: readonly [turns: string, name: string, detail: string][];
  setup: string;
  racing: string;
}

/** Original viewing notes, informed by the official guides linked in facts.ts.
 * These describe circuit character, not predictions of a particular race. */
export const CIRCUIT_GUIDES: Record<keyof typeof CIRCUIT_FACTS, CircuitGuide> = {
  albert_park: {
    kind: "Parkland circuit",
    intro: "Melbourne turns the roads around Albert Park Lake into a fast, flowing season venue. Its temporary surface gains grip through the weekend, while quick changes of direction reward a car that responds cleanly at the front. Formula 1 first raced here in 1996.",
    sections: [
      ["T1–2", "The opening chicane", "A busy first braking zone followed by an immediate change of direction. A clean exit matters as much as the entry."],
      ["T9–10", "Commitment by the lake", "The fast left-right sequence reveals how confidently a driver can change direction without unsettling the rear of the car."],
      ["T13–14", "Finish the lap", "The final corners trade entry speed for traction. A tidy last corner carries its reward down the pit straight."],
    ],
    setup: "Watch front-end response in the fast changes of direction and how the car handles bumps. Grip can change substantially as the track rubbers in.",
    racing: "Follow the exit from the final corner into the first braking zone. A quick sector is less useful if traffic compromises the next straight.",
  },
  shanghai: {
    kind: "Permanent circuit",
    intro: "Shanghai combines unusually long corners with one of Formula 1’s longest straights. The tightening opening complex and extended right-hander before the back straight make this a lap of patience, balance and carefully timed acceleration. The venue joined the championship in 2004.",
    sections: [
      ["T1–4", "The tightening spiral", "The opening right-hander keeps tightening before the circuit switches left. Going in too quickly can compromise several corners at once."],
      ["T7–8", "Loaded changes of direction", "Fast, sustained corners put the car under lateral load. Look for a smooth transition rather than repeated steering corrections."],
      ["T13–14", "The long run to the hairpin", "A long right-hander feeds the back straight. Exit speed sets up the heavy braking zone at Turn 14."],
    ],
    setup: "The left-front tyre works hard in the extended right-hand corners. A balanced car needs both patient cornering grip and efficient straight-line speed.",
    racing: "Turn 14 is a natural place to follow an attack developing. Watch the preceding exit and slipstream, not just the final braking move.",
  },
  suzuka: {
    kind: "Permanent circuit",
    intro: "Built as Honda’s test track, Suzuka is a figure-eight circuit that makes rhythm visible. The Esses, Degners and 130R link precision with high-speed commitment. A mistake early in a sequence can keep costing time long after the original corner.",
    sections: [
      ["T3–7", "The Esses", "One corner sets the line for the next. Smooth direction changes and a settled front end keep the whole sequence connected."],
      ["T8–9", "The Degners", "Two right-handers with very different speeds. The first demands commitment; the second demands a precise braking and turn-in point."],
      ["T15–17", "130R to the chicane", "A fast left-hander leads into a much slower chicane. The change of pace tests both confidence and braking control."],
    ],
    setup: "Look for aerodynamic balance through the Esses and a stable rear at high speed. Extra steering corrections usually reveal a compromised lap.",
    racing: "Track the run out of Spoon towards 130R and the final chicane. Following closely through the quick corners is part of preparing a pass.",
  },
  bahrain: {
    kind: "Permanent circuit",
    intro: "Sakhir’s desert layout combines long straights, heavy braking and slow-corner traction. Wind and changing temperatures can alter the balance through a weekend. The circuit remains part of Formula 1’s history even though its scheduled April 2026 Grand Prix was cancelled.",
    sections: [
      ["T1–3", "Stop, rotate, accelerate", "A tight opening right-hander leads straight into another direction change. Traction through the exit prepares the uphill run."],
      ["T9–10", "The downhill braking test", "Turn 10 asks the driver to slow and turn at the same time. A front-wheel lock-up can undo a good approach."],
      ["T11–12", "The faster side of Sakhir", "This flowing section contrasts with the stop-start corners. Here the car needs confidence under sustained lateral load."],
    ],
    setup: "Rear-tyre management and traction are important viewing themes. Braking stability must coexist with a car that turns cleanly at low speed.",
    racing: "Long straights give drivers time to prepare an attack, but defending one corner can leave a weak exit into the next acceleration zone.",
  },
  jeddah: {
    kind: "Street circuit",
    intro: "Jeddah threads fast, sweeping corners between walls along the Red Sea waterfront. Unlike a typical slow street circuit, it asks for sustained commitment and constant attention to the next bend. Its scheduled 2026 event was cancelled; the circuit guide remains available as a reference.",
    sections: [
      ["T1–2", "The first heavy stop", "The opening chicane interrupts the fast run past the pits. Braking and the second apex both matter in a close fight."],
      ["T4–10", "The wall-lined sequence", "A string of quick bends rewards accurate placement. Small corrections can disrupt the line through several following corners."],
      ["T27", "Back towards the pits", "The final left-hand hairpin resets the pace before the main straight. Exit traction gives an attack its foundation."],
    ],
    setup: "A stable car at high speed is essential to confidence between the walls. Watch how little steering correction the strongest laps need.",
    racing: "The run into the final hairpin and the next main-straight braking zone should be read together. Positioning at one shapes the next opportunity.",
  },
  miami: {
    kind: "Hybrid circuit",
    intro: "Miami’s stadium setting hides a varied technical challenge: quick opening corners, a cramped middle section and long acceleration zones. The temporary venue was designed to feel more like a permanent circuit, with the Hard Rock Stadium at the centre of the lap.",
    sections: [
      ["T4–8", "Find the flow", "The faster opening sequence asks for balance through linked bends before the lap starts to slow down."],
      ["T14–15", "The cresting chicane", "A narrow, slow chicane rises and falls beneath the flyovers. Accurate placement is more useful than an aggressive approach."],
      ["T17", "The big braking zone", "The long preceding straight brings a sharp change of speed. Watch the braking point and the room left for a rival."],
    ],
    setup: "The challenge is reconciling fast-corner stability with the agility needed in the tight middle section. The slowest corners can expose an awkward balance.",
    racing: "Watch exits onto the long straights and the approach to Turn 17. A car can recover a modest corner deficit when its acceleration is cleaner.",
  },
  montreal: {
    kind: "Parkland circuit",
    intro: "Circuit Gilles Villeneuve sits on Montreal’s Notre Dame Island. Its straights, chicanes and hairpin create a stop-start lap that rewards braking confidence and traction. The walls remain close, especially at the final chicane and its famous Wall of Champions.",
    sections: [
      ["T1–2", "A tightening opening", "The opening left-right changes both speed and direction. Running wide at the first apex can leave the car vulnerable at the second."],
      ["T10", "The hairpin", "One of the lap’s clearest changes of pace. Watch how the driver rotates the car before accelerating onto the long run."],
      ["T13–14", "Wall of Champions", "The final chicane rewards a precise line over the kerbs, with very little room for error on the exit."],
    ],
    setup: "Braking confidence, kerb behaviour and traction are the main clues. The car must tolerate abrupt changes without losing its stability.",
    racing: "The hairpin exit sets up the long straight. Compare a driver’s exit speed with their rival’s before judging the move at the final chicane.",
  },
  monaco: {
    kind: "Street circuit",
    intro: "Monaco turns everyday streets into Formula 1’s most intimate driving test. The short lap squeezes elevation changes, a hairpin, a tunnel and a swimming-pool chicane between barriers. Precision and confidence matter everywhere; open space to recover from a mistake is rare.",
    sections: [
      ["T1", "Sainte Dévote", "The first corner funnels the field towards the climb. Braking accuracy matters more than the modest-looking distance suggests."],
      ["T6–9", "Hairpin to tunnel", "The slow hairpin is followed by an entirely different challenge: building speed through Portier and into the tunnel."],
      ["T13–16", "The Swimming Pool", "Rapid direction changes close to the barriers make this a clear demonstration of driver confidence and car response."],
    ],
    setup: "Low-speed rotation and confidence near the walls dominate the lap. Watch a driver build speed over successive attempts rather than just the final time.",
    racing: "Qualifying position and the timing of stops deserve close attention because passing room is limited. Traffic can matter even when the car ahead is slower.",
  },
  barcelona: {
    kind: "Permanent circuit",
    intro: "Barcelona-Catalunya is a broad test of chassis balance, mixing long loaded corners with slower changes of direction. The current Formula 1 layout uses the fast final corners rather than the former chicane. Its variety made it a familiar testing venue for many years.",
    sections: [
      ["T1–3", "A corner that keeps going", "The opening chicane leads into the sustained right-hander at Turn 3. Front-end grip is easy to spot here."],
      ["T9", "Campsa", "The quick uphill right-hander rewards confidence and a car that stays composed as the driver commits to the apex."],
      ["T13–14", "The fast finish", "Two quick right-hand corners now complete the lap. Their exit feeds directly onto the main straight."],
    ],
    setup: "Long right-hand corners ask plenty of the left-front tyre. Watch whether the driver can hold a clean line as the stint develops.",
    racing: "Turn 1 is a key place to follow an attack. The speed carried through the final corners helps decide whether the following car gets close enough.",
  },
  spielberg: {
    kind: "Permanent circuit",
    intro: "The Red Bull Ring packs a steep climb, long straights and quick downhill bends into a short lap. Its simple-looking outline gives each braking zone extra importance: there are fewer corners in which to recover time lost elsewhere.",
    sections: [
      ["T1", "The uphill opener", "A climb towards the first right-hander tests braking judgement. The exit launches the car into another long acceleration zone."],
      ["T3–4", "Big stops at the top", "Two major braking zones interrupt the straights. The tight Turn 3 and downhill approach to Turn 4 ask different questions."],
      ["T9–10", "The downhill finish", "Fast right-handers close the lap. Look for commitment without sacrificing the line onto the pit straight."],
    ],
    setup: "Straight-line efficiency has to work alongside braking stability and fast-corner grip. Small differences become conspicuous on such a short lap.",
    racing: "A fight can extend across several straights. A driver who loses one corner may still have a chance if they leave with a better exit.",
  },
  silverstone: {
    kind: "Permanent circuit",
    intro: "Silverstone hosted the first Formula 1 World Championship race in 1950. The former airfield still defines itself through speed: broad, flowing corners and rapid changes of direction demand a balanced car and sustained commitment from the driver.",
    sections: [
      ["T1–2", "Abbey and Farm", "The opening sequence asks the driver to commit immediately. A calm steering trace is a useful sign of confidence."],
      ["T10–14", "Maggotts, Becketts, Chapel", "A celebrated series of direction changes ends on the Hangar Straight. One poor line can spoil the whole sequence."],
      ["T15–18", "Stowe to Club", "The fast Stowe corner gives way to slower bends near the pits. Braking and traction become more prominent here."],
    ],
    setup: "The strongest laps look connected through the quick corners. Watch whether tyre wear makes the driver add corrections as the stint progresses.",
    racing: "The exits onto the Wellington and Hangar straights help shape passing attempts. Clean preparation can matter as much as the final braking move.",
  },
  spa: {
    kind: "Permanent circuit",
    intro: "Spa is a long lap through the Ardennes, combining elevation, fast corners and extended straights. Its size brings an extra weather challenge: conditions can differ across the circuit. A good car needs confidence in the middle sector without giving away too much speed elsewhere.",
    sections: [
      ["T2–4", "Eau Rouge and Raidillon", "The track compresses at the bottom before climbing steeply. Placement through the crest sets up the Kemmel Straight."],
      ["T10–11", "Pouhon", "A sustained, fast double left-hander puts the car under load. This is a useful place to judge aerodynamic balance."],
      ["T18–19", "The final chicane", "A heavy stop after a long fast run. The slow exit is the last opportunity to prepare the following lap."],
    ],
    setup: "The long straights and loaded middle sector pull the setup in different directions. Watch where a car gains, not only its complete lap time.",
    racing: "Follow the run from La Source through Raidillon and along Kemmel. In changing weather, compare conditions across the full lap before reading a pace swing.",
  },
  budapest: {
    kind: "Permanent circuit",
    intro: "The Hungaroring is a compact sequence of corners with little time to reset between them. Its short straights put the emphasis on chassis balance and rhythm. A driver who gets out of position can carry that compromise through several bends.",
    sections: [
      ["T1–2", "The main passing approach", "The pit straight ends in a tight right-hander before the circuit drops left. Positioning through both corners matters in a fight."],
      ["T4–7", "Crest and chicane", "A quick corner over the crest leads towards the chicane. The car must switch from commitment to precise kerb use."],
      ["T12–14", "Set up the straight", "The closing corners gradually open the lap back up. A patient final turn can protect acceleration onto the main straight."],
    ],
    setup: "Downforce and a responsive chassis are useful themes to watch. The lack of long straights makes a smooth, repeatable rhythm particularly valuable.",
    racing: "Traffic and the gap around a pit stop can shape the race. Follow the final-corner exit when a driver is preparing to challenge into Turn 1.",
  },
  zandvoort: {
    kind: "Permanent circuit",
    intro: "Zandvoort flows through the Dutch dunes with elevation changes, quick corners and distinctive banking. Its compact shape gives the lap an old-school feel. The modern layout keeps drivers busy and makes confident placement a recurring theme.",
    sections: [
      ["T1", "Tarzan", "The opening banked right-hander is a natural focus for the start and close racing at the end of the pit straight."],
      ["T3", "Hugenholtzbocht", "The steeply banked left-hander offers a distinctive range of lines. Watch how a driver uses the banking on exit."],
      ["T13–14", "Banked run home", "The final sequence feeds the main straight. Carrying speed onto the banking can keep an attack alive."],
    ],
    setup: "The changes in camber and elevation ask for a predictable balance. A car that responds well through the linked corners can build confidence quickly.",
    racing: "Follow the approach to the final banking before a move into Tarzan. Positioning and exit speed help make the short passing opportunities count.",
  },
  monza: {
    kind: "Permanent circuit",
    intro: "Monza’s long straights and sharp chicanes make speed and braking its defining contrast. Set inside the royal park, it has been part of the World Championship since 1950. The lap rewards efficient acceleration without giving away confidence through its faster corners.",
    sections: [
      ["T1–2", "Rettifilo", "The first chicane follows the main straight. Drivers shed a huge amount of speed before changing direction over the kerbs."],
      ["T8–10", "Ascari", "Three linked corners need to be treated as one sequence. The final exit sets the speed for the following straight."],
      ["T11", "Curva Alboreto", "The long final right-hander opens onto the pit straight. Entry patience helps build the exit speed needed for the next lap."],
    ],
    setup: "Straight-line efficiency is central, but watch braking stability and kerb behaviour too. A car that is quick on the straight still has to survive the stops.",
    racing: "Slipstreams develop over long runs. Follow Ascari’s exit and the final corner to see how a driver prepares an attack before the first chicane.",
  },
  madrid: {
    kind: "Hybrid circuit",
    intro: "Madring brings Formula 1 to the roads and purpose-built sections around IFEMA Madrid. The new venue pairs fast public-road stretches with elevation changes and the banked La Monumental corner. This is a new circuit’s championship debut, separate from Madrid’s earlier races at Jarama.",
    sections: [
      ["T1–5", "The urban run", "The opening corners feed the fast public-road section. A long acceleration phase ends in a much slower braking zone."],
      ["T12", "La Monumental", "The long, banked right-hander is the lap’s signature. Watch the line through the banking and the transition into Turn 13."],
      ["T20–22", "The IFEMA finish", "Slow corners beside the exhibition halls complete the lap. Accurate rotation and traction prepare the return to the pit straight."],
    ],
    setup: "The street and purpose-built sections ask different questions. Look for the balance between stability in the banking and agility through the slow closing corners.",
    racing: "At a new venue, practice is especially useful for reading how grip develops. Follow the heavy braking approaches and avoid treating early pace as a settled order.",
  },
  baku: {
    kind: "Street circuit",
    intro: "Baku combines a very long waterfront run with narrow streets beside the old city walls. It first hosted Formula 1 as the European Grand Prix in 2016. The contrast between open straights and confined corners makes car setup an unusually visible compromise.",
    sections: [
      ["T1–2", "Waterfront braking", "Wide approaches at the end of the fast run contrast with the slow right-angle corners. Watch braking and exit traction together."],
      ["T8–12", "The castle section", "The circuit tightens as it climbs past the old city. Accurate placement leaves little room for an untidy line."],
      ["T16–20", "The run back to the line", "The final acceleration phase builds through fast bends towards the pits. An exit deficit can grow for a long time here."],
    ],
    setup: "The old town needs grip and confidence; the waterfront run rewards low drag. Sector splits can reveal which side of that compromise a team favours.",
    racing: "Watch the gap leaving Turn 16 before the long run to Turn 1. A strong slipstream can make a fight look very different by the braking zone.",
  },
  sepang: {
    kind: "Permanent circuit",
    intro: "Sepang’s wide track links fast sweepers, slow hairpins and two long straights. It opened in 1999 and became a reference point for modern circuit design. Heat, humidity and sudden rain add another layer to a lap that already asks a lot of the car.",
    sections: [
      ["T1–2", "A tightening start", "The opening right-hander keeps turning before the track switches left. Patience helps the driver connect the two corners."],
      ["T5–6", "The fast sweepers", "A flowing left-right section loads the tyres and exposes the car’s balance. Look for a smooth change of direction."],
      ["T15", "The final hairpin", "The two long straights meet at a slow hairpin. Braking on entry and traction on exit both shape a passing attempt."],
    ],
    setup: "The varied corners reward a complete car rather than one isolated strength. Hot conditions make tyre behaviour and consistency worth following through a stint.",
    racing: "The wide layout allows different approaches to a corner. Watch the final hairpin and the next straight as one connected battle, especially when grip changes.",
  },
  singapore: {
    kind: "Street circuit",
    intro: "Marina Bay combines a bumpy street surface, tight corners and humid night-time conditions. The revised layout has fewer corners than the original circuit, but it remains a busy lap. Drivers need precision while the car repeatedly slows, rotates and accelerates between barriers.",
    sections: [
      ["T1–3", "A busy opening", "Three linked corners set the rhythm immediately. A compromised first turn can limit the car’s position through the whole sequence."],
      ["T7", "End of the fast run", "A long approach finishes in a heavy braking zone. The transition from straight-line speed to rotation deserves close attention."],
      ["T18–19", "The final sweep", "The closing left-hand corners return the car to the pit straight. A tidy line helps carry speed onto the next lap."],
    ],
    setup: "Look for a car that stays settled over bumps and finds traction out of slow corners. Consistency matters as the demanding conditions accumulate.",
    racing: "Follow traffic gaps as well as lap times when pit stops approach. A driver emerging into a pack can find it hard to use fresh-tyre pace.",
  },
  austin: {
    kind: "Permanent circuit",
    intro: "The Circuit of the Americas mixes a steep opening climb, fast Esses, long straights and a technical stadium section. Its layout draws on several classic circuit ideas. A quick lap has to connect these very different demands without leaving the car compromised between sectors.",
    sections: [
      ["T1", "The climb", "The wide uphill approach encourages different lines. The blind-feeling turn-in makes braking judgement a prominent part of the start."],
      ["T3–6", "The Esses", "Successive fast direction changes test front-end response. A clean first entry makes the remainder of the sequence easier to connect."],
      ["T12–15", "The stadium section", "A heavy stop at the end of the back straight leads into slower, technical corners. Positioning can keep a fight going."],
    ],
    setup: "The car needs fast-corner balance without becoming reluctant to rotate in the stadium section. Sector-by-sector performance is more revealing than a single straight-line speed.",
    racing: "Turns 1 and 12 are clear places to watch an attack develop. The broad entries can allow competing lines, so follow the exit too.",
  },
  mexico_city: {
    kind: "Permanent circuit",
    intro: "Mexico City races more than two kilometres above sea level. The thin air adds a distinctive challenge to a layout with a long main straight, flowing middle section and stadium finish. The current circuit broadly follows its historic outline, with a very different final sector.",
    sections: [
      ["T1–3", "The long approach", "The main straight ends in a linked sequence. A move into the first corner is not necessarily settled before the third."],
      ["T7–11", "The flowing middle", "The circuit switches character through successive bends. Watch how confidently the car changes direction as the pace builds."],
      ["T13–17", "Through the stadium", "Slow corners bring the cars into the stadium before the final acceleration zone. A clean exit helps on the long straight."],
    ],
    setup: "The altitude changes the aerodynamic and cooling challenge. Watch balance through the middle sector rather than assuming a high top speed means a strong all-round lap.",
    racing: "The long approach to Turn 1 can bring several cars together. Track the whole opening sequence, where a driver’s chosen line determines the next corner.",
  },
  interlagos: {
    kind: "Permanent circuit",
    intro: "Interlagos drops through the Senna S, winds across a compact infield and climbs back towards the start line. Its elevation and changing camber make the short lap feel varied. Brazil first hosted a World Championship race at this venue in 1973.",
    sections: [
      ["T1–3", "The Senna S", "The lap begins downhill with a left-right sequence. Braking, placement and the exit towards the next straight work together."],
      ["T8–11", "The infield", "Slower corners and changes in camber interrupt the faster outer sections. Watch the driver manage rotation without losing traction."],
      ["T12–15", "The climb home", "Junção sets up the long uphill acceleration phase. A small mistake at its exit can cost speed all the way to the line."],
    ],
    setup: "The infield needs grip while the long uphill run rewards efficient acceleration. Watch whether a car’s advantage changes noticeably between the two parts of the lap.",
    racing: "An attack into the Senna S often starts at Junção on the previous lap. The run towards Turn 4 can offer a second phase to the same fight.",
  },
  las_vegas: {
    kind: "Street circuit",
    intro: "The Strip circuit takes Formula 1 past Las Vegas landmarks on a lap dominated by long acceleration zones and heavy stops. It debuted in 2023, on a different layout from the city’s earlier Caesars Palace races. Street-circuit precision meets unusually sustained high speed.",
    sections: [
      ["T1", "The opening hairpin", "A slow left-hander begins the lap. The braking point and traction out of the corner are easy to compare between drivers."],
      ["T7–9", "Around the Sphere", "A slower technical sequence contrasts with the long straights. The car must rotate cleanly without sacrificing the following acceleration."],
      ["T14–16", "The stop after the Strip", "The long run along the Strip ends in a sharp change of pace. A late move still needs a workable exit."],
    ],
    setup: "Straight-line efficiency and braking confidence are central to the lap. Watch how quickly a driver gets the tyres working after a stop or a slow period.",
    racing: "The long straights let slipstreams develop. Keep an eye on the gap well before the braking zone, then follow the move through the subsequent corners.",
  },
  lusail: {
    kind: "Permanent circuit",
    intro: "Originally built for motorcycle racing, Lusail links medium- and high-speed corners into a flowing lap. The long main straight provides a distinct contrast to the busy remainder of the circuit. Formula 1 first raced here in 2021.",
    sections: [
      ["T1", "The main braking chance", "The long pit straight ends in a right-hander. Exit control matters when two cars arrive close together."],
      ["T4–6", "Keep the rhythm", "The linked corners reward a settled balance. Steering corrections can make a driver lose momentum across the sequence."],
      ["T12–14", "The sustained right-hand run", "A fast series of right-hand corners keeps the car under load. This is a useful place to watch how the tyres behave."],
    ],
    setup: "Sustained cornering puts a premium on balance and tyre behaviour. Compare the driver’s steering confidence early and late in a stint.",
    racing: "Turn 1 is a clear place to follow a challenge. The final-corner exit and the ability to stay close through the preceding lap help create it.",
  },
  yas_marina: {
    kind: "Permanent circuit",
    intro: "Yas Marina combines long straights with slower technical sections beside the marina. The 2021 changes shortened and opened up parts of the lap, including the banked Turn 9. It has hosted Formula 1 since 2009 and is a familiar championship finale venue.",
    sections: [
      ["T5–6", "Hairpin to the long straight", "The Turn 5 exit sets up an extended acceleration phase before heavy braking. It is a natural sequence to follow in a battle."],
      ["T9", "The banked left-hander", "The sweeping corner replaced a slower sequence in the redesign. Watch how drivers use its width and banking."],
      ["T10–12", "Braking while turning", "The technical run near the hotel asks the driver to reduce speed while the car still carries lateral load."],
    ],
    setup: "The long straights and technical final sector reward different strengths. A car needs traction and predictable rotation as well as straight-line efficiency.",
    racing: "Watch the exits onto the two long straights. Consecutive braking opportunities can turn a single passing attempt into a multi-corner exchange.",
  },
};

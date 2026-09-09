export interface GarageLegend {
  id: string; name: string; team: string; year: string; driver: string;
  number: string; accent: string; tagline: string; story: string; detail: string;
  poster: string; modelId: string; creator: string; creatorUrl: string;
  modelUrl: string; credit: string; sourceUrl: string;
  stats: readonly { value: string; label: string }[];
}

/** Historical exhibits, independent of the current-season grid. */
export const GARAGE_LEGENDS: readonly GarageLegend[] = [
  {
    id: "rb19", name: "RB19", team: "Red Bull Racing", year: "2023",
    driver: "Max Verstappen", number: "1", accent: "#3671C6",
    tagline: "A season without equal.",
    story: "Twenty-one wins from twenty-two races. The RB19 carried Verstappen to his third world championship and made 2023 a defining season for Red Bull Racing.",
    detail: "Follow the sculpted sidepods, the floor edge and the tightly packaged rear bodywork. This exhibit wears Verstappen’s number 1 livery.",
    poster: "/garage/rb19.webp", modelId: "e4afe46f3aab4b23a418da06fc163821",
    creator: "Redgrund", creatorUrl: "https://sketchfab.com/redgrund",
    modelUrl: "https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821",
    credit: "CC BY 4.0", sourceUrl: "https://global.honda/en/F1/machine/2023_RedBullRB19/",
    stats: [{ value: "21 / 22", label: "Team race wins" }, { value: "3rd", label: "Verstappen’s title" }, { value: "2023", label: "Championship season" }],
  },
  {
    id: "w11", name: "W11", team: "Mercedes-AMG Petronas", year: "2020",
    driver: "Lewis Hamilton", number: "44", accent: "#27F4D2",
    tagline: "The seventh crown.",
    story: "Hamilton matched the record of seven world titles at the wheel of the W11. Mercedes finished the shortened 2020 season with both drivers at the top of the standings.",
    detail: "Explore the intricate front wing, exposed suspension and compact hybrid-era bodywork. The model shows the silver launch livery, before the team switched to black for the racing season.",
    poster: "/garage/w11.webp", modelId: "aeb8ed9bd3e24741a3b06029e8454d54",
    creator: "attix84work", creatorUrl: "https://sketchfab.com/attix84work",
    modelUrl: "https://sketchfab.com/3d-models/f1-mercedes-w11-2020-aeb8ed9bd3e24741a3b06029e8454d54",
    credit: "Creator-hosted exhibit · editorial model",
    sourceUrl: "https://www.mercedesamgf1.com/news/mercedes-ends-2020-f1-season-with-a-double-podium-finish",
    stats: [{ value: "7th", label: "Hamilton’s title" }, { value: "573", label: "Team points" }, { value: "1–2", label: "Drivers’ championship" }],
  },
  {
    id: "f2004", name: "F2004", team: "Scuderia Ferrari", year: "2004",
    driver: "Michael Schumacher", number: "1", accent: "#E8002D",
    tagline: "The V10 masterpiece.",
    story: "Fifteen victories in eighteen races. Ferrari’s F2004 delivered Schumacher’s seventh world championship and remains one of the defining machines of the V10 era.",
    detail: "An open cockpit, grooved tyres and a very different aerodynamic silhouette. Look closely at the high nose and the layered wings of this pre-hybrid Ferrari.",
    poster: "/garage/f2004.webp", modelId: "827e64acecba4f008759ae30a5bfeecc",
    creator: "Dave Love SketchFab", creatorUrl: "https://sketchfab.com/Tyler_Dave",
    modelUrl: "https://sketchfab.com/3d-models/2004-ferrari-f2004-827e64acecba4f008759ae30a5bfeecc",
    credit: "CC BY 4.0", sourceUrl: "https://www.ferrari.com/en-CA/corse-clienti/articles/f2004-returns-to-site-of-memorable-one-two",
    stats: [{ value: "15 / 18", label: "Team race wins" }, { value: "7th", label: "Schumacher’s title" }, { value: "V10", label: "Engine configuration" }],
  },
  {"id": "mp44", "name": "MP4/4", "team": "McLaren Honda", "year": "1988", "driver": "Ayrton Senna", "number": "12", "accent": "#FF3D20", "tagline": "The first crown.", "story": "McLaren won fifteen of sixteen Grands Prix in 1988. Senna took eight victories and his first world championship in the low-slung Honda-powered MP4/4.", "detail": "Explore the low bodywork and turbo-era proportions. This number 12 reconstruction focuses on the exterior; its engine and cockpit internals are not complete.", "poster": "/garage/mp44.webp", "modelId": "64388f3c5223452c93356e6586f1c818", "creator": "Kenkento3D", "creatorUrl": "https://sketchfab.com/kenkento.zapater", "modelUrl": "https://sketchfab.com/3d-models/mclaren-mp44-f1-car-1988-64388f3c5223452c93356e6586f1c818", "credit": "Creator-hosted exhibit", "sourceUrl": "https://www.mclaren.com/racing/heritage/formula-1/cars/1988-formula-1-mclaren-mp4-4/", "stats": [{"value": "15 / 16", "label": "Team race wins"}, {"value": "8", "label": "Senna wins"}, {"value": "1st", "label": "Senna’s title"}]},
  {"id": "fw14b", "name": "FW14B", "team": "Williams Renault", "year": "1992", "driver": "Nigel Mansell", "number": "5", "accent": "#FFD400", "tagline": "Red Five. Untouchable.", "story": "Mansell’s Red Five delivered nine wins and the 1992 drivers’ championship. The FW14B paired a Renault V10 with active suspension and a semi-automatic gearbox.", "detail": "Look for the raised nose, sculpted sidepods and unmistakable red number 5. This exhibit recreates Mansell’s blue, white and yellow Williams.", "poster": "/garage/fw14b.webp", "modelId": "f154aee675144df4a47e2c3c9590ed50", "creator": "Flamestroke", "creatorUrl": "https://sketchfab.com/Flamestroke", "modelUrl": "https://sketchfab.com/3d-models/williams-racing-f1-fw14b-1992-f154aee675144df4a47e2c3c9590ed50", "credit": "Creator-hosted exhibit", "sourceUrl": "https://www.williamsf1.com/articles/22794892-7962-4c82-b00b-90aac32870b8/nigel-mansell-and-the-fw14b-an-iconic-duo", "stats": [{"value": "9", "label": "Mansell wins"}, {"value": "10", "label": "Team race wins"}, {"value": "V10", "label": "Engine configuration"}]},
];

export function getGarageLegend(id: string | null | undefined): GarageLegend {
  return GARAGE_LEGENDS.find((car) => car.id === id) ?? GARAGE_LEGENDS[0];
}

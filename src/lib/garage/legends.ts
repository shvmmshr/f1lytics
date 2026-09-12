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
    "id": "rb19",
    "name": "RB19",
    "team": "Red Bull Racing",
    "year": "2023",
    "driver": "Max Verstappen",
    "number": "1",
    "accent": "#3671C6",
    "tagline": "A season without equal.",
    "story": "Twenty-one wins from twenty-two races. The RB19 carried Verstappen to his third world championship and made 2023 a defining season for Red Bull Racing.",
    "detail": "Follow the sculpted sidepods, the floor edge and the tightly packaged rear bodywork. This exhibit wears Verstappen’s number 1 livery.",
    "poster": "/garage/rb19.webp",
    "modelId": "e4afe46f3aab4b23a418da06fc163821",
    "creator": "Redgrund",
    "creatorUrl": "https://sketchfab.com/redgrund",
    "modelUrl": "https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821",
    "credit": "CC BY 4.0",
    "sourceUrl": "https://global.honda/en/F1/machine/2023_RedBullRB19/",
    "stats": [
      {
        "value": "21 / 22",
        "label": "Team race wins"
      },
      {
        "value": "3rd",
        "label": "Verstappen’s title"
      },
      {
        "value": "2023",
        "label": "Championship season"
      }
    ]
  },
  {
    "id": "w11",
    "name": "W11",
    "team": "Mercedes-AMG Petronas",
    "year": "2020",
    "driver": "Lewis Hamilton",
    "number": "44",
    "accent": "#27F4D2",
    "tagline": "The seventh crown.",
    "story": "Hamilton matched the record of seven world titles at the wheel of the W11. Mercedes finished the shortened 2020 season with both drivers at the top of the standings.",
    "detail": "Explore the intricate front wing, exposed suspension and compact hybrid-era bodywork. The model shows the silver launch livery, before the team switched to black for the racing season.",
    "poster": "/garage/w11.webp",
    "modelId": "aeb8ed9bd3e24741a3b06029e8454d54",
    "creator": "attix84work",
    "creatorUrl": "https://sketchfab.com/attix84work",
    "modelUrl": "https://sketchfab.com/3d-models/f1-mercedes-w11-2020-aeb8ed9bd3e24741a3b06029e8454d54",
    "credit": "Creator-hosted exhibit · editorial model",
    "sourceUrl": "https://www.mercedesamgf1.com/news/mercedes-ends-2020-f1-season-with-a-double-podium-finish",
    "stats": [
      {
        "value": "7th",
        "label": "Hamilton’s title"
      },
      {
        "value": "573",
        "label": "Team points"
      },
      {
        "value": "1–2",
        "label": "Drivers’ championship"
      }
    ]
  },
  {
    "id": "f2004",
    "name": "F2004",
    "team": "Scuderia Ferrari",
    "year": "2004",
    "driver": "Michael Schumacher",
    "number": "1",
    "accent": "#E8002D",
    "tagline": "The V10 masterpiece.",
    "story": "Fifteen victories in eighteen races. Ferrari’s F2004 delivered Schumacher’s seventh world championship and remains one of the defining machines of the V10 era.",
    "detail": "An open cockpit, grooved tyres and a very different aerodynamic silhouette. Look closely at the high nose and the layered wings of this pre-hybrid Ferrari.",
    "poster": "/garage/f2004.webp",
    "modelId": "827e64acecba4f008759ae30a5bfeecc",
    "creator": "Dave Love SketchFab",
    "creatorUrl": "https://sketchfab.com/Tyler_Dave",
    "modelUrl": "https://sketchfab.com/3d-models/2004-ferrari-f2004-827e64acecba4f008759ae30a5bfeecc",
    "credit": "CC BY 4.0",
    "sourceUrl": "https://www.ferrari.com/en-CA/corse-clienti/articles/f2004-returns-to-site-of-memorable-one-two",
    "stats": [
      {
        "value": "15 / 18",
        "label": "Team race wins"
      },
      {
        "value": "7th",
        "label": "Schumacher’s title"
      },
      {
        "value": "V10",
        "label": "Engine configuration"
      }
    ]
  },
  {
    "id": "mp44",
    "name": "MP4/4",
    "team": "McLaren Honda",
    "year": "1988",
    "driver": "Ayrton Senna",
    "number": "12",
    "accent": "#FF3D20",
    "tagline": "The first crown.",
    "story": "McLaren won fifteen of sixteen Grands Prix in 1988. Senna took eight victories and his first world championship in the low-slung Honda-powered MP4/4.",
    "detail": "Explore the low bodywork and turbo-era proportions. This number 12 reconstruction focuses on the exterior; its engine and cockpit internals are not complete.",
    "poster": "/garage/mp44.webp",
    "modelId": "64388f3c5223452c93356e6586f1c818",
    "creator": "Kenkento3D",
    "creatorUrl": "https://sketchfab.com/kenkento.zapater",
    "modelUrl": "https://sketchfab.com/3d-models/mclaren-mp44-f1-car-1988-64388f3c5223452c93356e6586f1c818",
    "credit": "Creator-hosted exhibit",
    "sourceUrl": "https://www.mclaren.com/racing/heritage/formula-1/cars/1988-formula-1-mclaren-mp4-4/",
    "stats": [
      {
        "value": "15 / 16",
        "label": "Team race wins"
      },
      {
        "value": "8",
        "label": "Senna wins"
      },
      {
        "value": "1st",
        "label": "Senna’s title"
      }
    ]
  },
  {
    "id": "fw14b",
    "name": "FW14B",
    "team": "Williams Renault",
    "year": "1992",
    "driver": "Nigel Mansell",
    "number": "5",
    "accent": "#FFD400",
    "tagline": "Red Five. Untouchable.",
    "story": "Mansell’s Red Five delivered nine wins and the 1992 drivers’ championship. The FW14B paired a Renault V10 with active suspension and a semi-automatic gearbox.",
    "detail": "Look for the raised nose, sculpted sidepods and unmistakable red number 5. This exhibit recreates Mansell’s blue, white and yellow Williams.",
    "poster": "/garage/fw14b.webp",
    "modelId": "f154aee675144df4a47e2c3c9590ed50",
    "creator": "Flamestroke",
    "creatorUrl": "https://sketchfab.com/Flamestroke",
    "modelUrl": "https://sketchfab.com/3d-models/williams-racing-f1-fw14b-1992-f154aee675144df4a47e2c3c9590ed50",
    "credit": "Creator-hosted exhibit",
    "sourceUrl": "https://www.williamsf1.com/articles/22794892-7962-4c82-b00b-90aac32870b8/nigel-mansell-and-the-fw14b-an-iconic-duo",
    "stats": [
      {
        "value": "9",
        "label": "Mansell wins"
      },
      {
        "value": "10",
        "label": "Team race wins"
      },
      {
        "value": "V10",
        "label": "Engine configuration"
      }
    ]
  },
  {
    "id": "rb9",
    "name": "RB9",
    "team": "Red Bull Racing",
    "year": "2013",
    "driver": "Sebastian Vettel",
    "number": "1",
    "accent": "#3671C6",
    "tagline": "Nine Sundays in a row.",
    "story": "Vettel closed 2013 with nine consecutive victories. Thirteen wins across the season delivered his fourth drivers’ title and Red Bull Racing’s fourth constructors’ championship.",
    "detail": "The final Red Bull champion of the naturally aspirated V8 era. Explore the high nose, tightly packaged rear bodywork and purple-accented Infiniti livery of this artist reconstruction.",
    "sourceUrl": "https://www.redbullracing.com/int-en/cars/rb9",
    "stats": [
      {
        "value": "13",
        "label": "Vettel wins"
      },
      {
        "value": "9",
        "label": "Consecutive wins"
      },
      {
        "value": "4th",
        "label": "Vettel’s title"
      }
    ],
    "poster": "/garage/rb9.webp",
    "modelId": "3c44792002c94d3887ebdce30cfec797",
    "creator": "JUSTGAME",
    "creatorUrl": "https://sketchfab.com/JUSTGAME",
    "modelUrl": "https://sketchfab.com/3d-models/red-bull-rb9-3c44792002c94d3887ebdce30cfec797",
    "credit": "CC BY 4.0"
  },
  {
    "id": "bgp001",
    "name": "BGP 001",
    "team": "Brawn GP",
    "year": "2009",
    "driver": "Jenson Button",
    "number": "22",
    "accent": "#C6DE20",
    "tagline": "One season. Both titles.",
    "story": "Brawn GP emerged from Honda’s departure and won both championships in its only season. Button won six of the first seven races, while he and Rubens Barrichello took eight victories between them.",
    "detail": "Look for the broad front wing, tall rear wing and white-and-fluorescent-yellow bodywork. This number 22 reconstruction represents Button’s Mercedes-powered Brawn.",
    "sourceUrl": "https://www.formula1.com/en/latest/article/exclusive-from-trendsetters-to-title-winners-ross-brawn-reveals-his.6FIAnV6e71kvi8PVInIuPo",
    "stats": [
      {
        "value": "8",
        "label": "Team race wins"
      },
      {
        "value": "6",
        "label": "Button wins"
      },
      {
        "value": "2",
        "label": "World titles in 2009"
      }
    ],
    "poster": "/garage/bgp001.webp",
    "modelId": "4c02d48be0104a79b657e732890e6d54",
    "creator": "Dave Love SketchFab",
    "creatorUrl": "https://sketchfab.com/Tyler_Dave",
    "modelUrl": "https://sketchfab.com/3d-models/2009-brawn-gp-4c02d48be0104a79b657e732890e6d54",
    "credit": "CC BY 4.0"
  },
  {
    "id": "r25",
    "name": "R25",
    "team": "Renault F1 Team",
    "year": "2005",
    "driver": "Fernando Alonso",
    "number": "5",
    "accent": "#69BDF5",
    "tagline": "A new champion. A V10 farewell.",
    "story": "The R25 carried Alonso to his first world championship and Renault to its first constructors’ title. Alonso and Giancarlo Fisichella combined for eight wins in the final season of the three-litre V10 formula.",
    "detail": "This number 5 exhibit wears Renault’s blue-and-yellow livery. Inspect the raised front wing, grooved Michelin tyres and compact rear bodywork of the car that ended Ferrari’s run of titles.",
    "sourceUrl": "https://www.formula1.com/en/latest/article/alonso-to-run-title-winning-renault-r25-in-abu-dhabi-to-celebrate-the-teams.5e69LF1WmuVtINpTKlpGtd",
    "stats": [
      {
        "value": "8",
        "label": "Team race wins"
      },
      {
        "value": "1st",
        "label": "Alonso’s title"
      },
      {
        "value": "V10",
        "label": "Engine configuration"
      }
    ],
    "poster": "/garage/r25.webp",
    "modelId": "0d58fe125f5b41a2b8482576723120c4",
    "creator": "Dave Love SketchFab",
    "creatorUrl": "https://sketchfab.com/Tyler_Dave",
    "modelUrl": "https://sketchfab.com/3d-models/2005-renault-r25-0d58fe125f5b41a2b8482576723120c4",
    "credit": "CC BY 4.0"
  },
  {
    "id": "mp413",
    "name": "MP4/13",
    "team": "McLaren Mercedes",
    "year": "1998",
    "driver": "Mika Häkkinen",
    "number": "8",
    "accent": "#D1D5DB",
    "tagline": "The silver comeback.",
    "story": "Häkkinen won eight races on the way to his first world championship. With another victory from David Coulthard, the MP4/13 also brought McLaren its first constructors’ title since 1991.",
    "detail": "The narrow-track, grooved-tyre rules gave 1998 cars a distinct silhouette. This silver-and-black number 8 reconstruction wears Häkkinen’s livery, with its red nose number and compact V10-era proportions.",
    "sourceUrl": "https://www.mclaren.com/racing/heritage/formula-1/cars/mp4-13/",
    "stats": [
      {
        "value": "9",
        "label": "Team race wins"
      },
      {
        "value": "8",
        "label": "Häkkinen wins"
      },
      {
        "value": "1st",
        "label": "Häkkinen’s title"
      }
    ],
    "poster": "/garage/mp413.webp",
    "modelId": "a1a85be6c06f4c93b67da7e12693c978",
    "creator": "jormapaappa1235",
    "creatorUrl": "https://sketchfab.com/jormapaappa1235",
    "modelUrl": "https://sketchfab.com/3d-models/mclaren-mp4-13-1998-a1a85be6c06f4c93b67da7e12693c978",
    "credit": "Creator-hosted exhibit"
  }
];

export function getGarageLegend(id: string | null | undefined): GarageLegend {
  return GARAGE_LEGENDS.find((car) => car.id === id) ?? GARAGE_LEGENDS[0];
}

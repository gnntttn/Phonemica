import { Language } from './types';

export const SCENARIOS = {
  [Language.French]: [
    "Commander dans un café",
    "Demander son chemin",
    "Se présenter à quelqu'un",
    "Faire des courses",
  ],
  [Language.Arabic]: [
    "الطلب في مقهى",
    "السؤال عن الاتجاهات",
    "تقديم نفسك لشخص ما",
    "الذهاب للتسوق",
  ],
};

export const GAME_SCENARIOS = {
    [Language.French]: [
        "À la boulangerie",
        "Au restaurant",
        "Dans un taxi",
    ],
    [Language.Arabic]: [
        "في المخبز",
        "في المطعم",
        "في سيارة أجرة",
    ],
}

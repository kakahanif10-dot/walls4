import fs from "fs";

const content = fs.readFileSync("./lib/content.ts", "utf8");
const courseIndex = content.indexOf("export type Lesson = {");

if (courseIndex === -1) {
  console.error("Could not find export type Lesson");
  process.exit(1);
}

const restOfFile = content.substring(courseIndex);

const newHeader = `export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  category?: "markets" | "crypto" | "meme";
  author: string;
  role: string;
  date: string;
  readMinutes: number;
  tags: string[];
  premium: boolean;
  tickers: string[];
  body: Block[];
};

import { RESEARCH_DECKS_70, DECKS_BY_CATEGORY, DECK_BY_SLUG, type ResearchDeck } from "./research-decks-70";
export { RESEARCH_DECKS_70, DECKS_BY_CATEGORY, DECK_BY_SLUG };
export type { ResearchDeck };

export const ARTICLES: Article[] = RESEARCH_DECKS_70;
export const ARTICLE_BY_SLUG: Record<string, Article> = DECK_BY_SLUG;

`;

fs.writeFileSync("./lib/content.ts", newHeader + restOfFile);
console.log("Successfully updated lib/content.ts with 70 research decks!");

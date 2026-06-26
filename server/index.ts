import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { loadEnv } from "vite";
import {
  buildOfferOgMeta,
  fetchPublicOfferPreview,
  injectOfferOgMetaIntoHtml,
} from "../src/lib/publicOfferPreview";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const distIndexPath = path.join(distDir, "index.html");

const mode = process.env.NODE_ENV === "development" ? "development" : "production";
const env = loadEnv(mode, rootDir, "");
const API_BASE_URL =
  env.VITE_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";
const WEB_URL =
  env.VITE_APP_WEB_URL ||
  process.env.VITE_APP_WEB_URL ||
  "https://app.medneeds.com.br";
const PORT = Number(process.env.PORT || 8080);

let cachedIndexHtml: string | null = null;

async function getIndexHtml(): Promise<string> {
  if (!cachedIndexHtml) {
    cachedIndexHtml = await fs.readFile(distIndexPath, "utf-8");
  }
  return cachedIndexHtml;
}

async function renderOfferPage(offerId: string): Promise<string> {
  const baseHtml = await getIndexHtml();
  const pageUrl = `${WEB_URL.replace(/\/$/, "")}/oferta/${offerId}`;

  try {
    const offer = await fetchPublicOfferPreview(offerId, API_BASE_URL);
    const meta = buildOfferOgMeta(offer, pageUrl, API_BASE_URL);
    return injectOfferOgMetaIntoHtml(baseHtml, meta);
  } catch {
    return baseHtml;
  }
}

const app = express();

app.get("/oferta/:id", async (req, res, next) => {
  try {
    const html = await renderOfferPage(req.params.id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distDir, { index: false }));

app.get("*", async (_req, res, next) => {
  try {
    const html = await getIndexHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, () => {
  console.log(`Medneeds portal em http://localhost:${PORT}`);
  console.log(`API: ${API_BASE_URL}`);
  console.log(`URL pública: ${WEB_URL}`);
});

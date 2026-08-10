import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const basePath = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
}

if (!fs.existsSync(root)) throw new Error("Static export directory out/ is missing");
walk(root);

const requiredPages = [
  "index.html",
  "404.html",
  "admin/index.html",
  "catalog/index.html",
  "checkout/index.html",
  "contact/index.html",
  "custom/index.html",
  "legal/index.html",
  "product/index.html",
  "robots.txt",
  "sitemap.xml",
  "product/larimar-sky/index.html",
  "product/labrador-night/index.html",
  "product/charoite-violet/index.html",
];

const missingRequired = requiredPages.filter(
  (relativePath) => !fs.existsSync(path.join(root, relativePath)),
);
const missingReferences = [];
const forbiddenRuntimeReferences = [];

for (const htmlPath of files.filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(htmlPath, "utf8");

  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = match[1];

    if (/oaiusercontent|chatgpt\.site|fonts\.googleapis|fonts\.gstatic/.test(url)) {
      forbiddenRuntimeReferences.push({ htmlPath, url });
    }

    if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/#")) {
      continue;
    }

    const cleanPath = decodeURIComponent(url.split(/[?#]/)[0]);
    const localPath =
      basePath && (cleanPath === basePath || cleanPath.startsWith(`${basePath}/`))
        ? cleanPath.slice(basePath.length) || "/"
        : cleanPath;
    if (!localPath || localPath === "/") continue;

    const target = path.join(root, localPath.replace(/^\//, ""));
    const candidates = [target, `${target}.html`, path.join(target, "index.html")];

    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      missingReferences.push({
        page: path.relative(root, htmlPath),
        url,
      });
    }
  }
}

if (missingRequired.length || missingReferences.length || forbiddenRuntimeReferences.length) {
  console.error(
    JSON.stringify(
      { missingRequired, missingReferences, forbiddenRuntimeReferences },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(`Validated ${files.length} exported files with no missing local assets.`);

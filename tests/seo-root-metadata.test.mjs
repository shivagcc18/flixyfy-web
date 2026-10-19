import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadata = JSON.parse(readFileSync(path.join(projectRoot, "src/lib/seo-root-metadata.json"), "utf8"));
const layout = readFileSync(path.join(projectRoot, "src/app/layout.tsx"), "utf8");

test("root metadata gives child pages a branded title template and useful description", () => {
  assert.deepEqual(metadata.title, {
    default: "Flixyfy | Indian Movies and Cinema",
    template: "%s | Flixyfy",
  });
  assert.match(metadata.description, /Indian movies/i);
  assert.match(metadata.description, /people/i);
  assert.match(metadata.description, /watch/i);
  assert.equal(metadata.applicationName, "Flixyfy");
});

test("Open Graph and X cards reuse the truthful site title and description", () => {
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.siteName, "Flixyfy");
  assert.equal(metadata.openGraph.title, metadata.title.default);
  assert.equal(metadata.openGraph.description, metadata.description);
  assert.equal(metadata.twitter.card, "summary");
  assert.equal(metadata.twitter.title, metadata.title.default);
  assert.equal(metadata.twitter.description, metadata.description);
});

test("Next root layout consumes the tested Metadata API object without guessing a canonical host", () => {
  assert.match(layout, /import\s+rootMetadata\s+from\s+["']\.\.\/lib\/seo-root-metadata\.json["']/);
  assert.match(layout, /export\s+const\s+metadata:\s*Metadata\s*=\s*rootMetadata/);
  assert.equal(metadata.metadataBase, undefined);
  assert.equal(metadata.alternates?.canonical, undefined);
});

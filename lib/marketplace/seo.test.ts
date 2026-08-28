import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicBusinessProfile, getPublicCategoryDirectory } from "./data";
import {
  buildBusinessProfileJsonLd,
  buildCategoryJsonLd,
  serializeJsonLd,
} from "./seo";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("marketplace structured data", () => {
  it("builds LocalBusiness, catalog and breadcrumb entities for a profile", async () => {
    vi.stubEnv("SITE_URL", "https://example.com/");
    const detail = await getPublicBusinessProfile("conecta-movil-demo");
    if (!detail) throw new Error("fixture missing");

    const schema = buildBusinessProfileJsonLd(detail);
    const serialized = JSON.stringify(schema);

    expect(serialized).toContain('"@type":"LocalBusiness"');
    expect(serialized).toContain('"@type":"Product"');
    expect(serialized).toContain('"@type":"BreadcrumbList"');
    expect(serialized).toContain("https://example.com/locales/conecta-movil-demo");
    expect(serialized).not.toContain('"telephone"');
  });

  it("builds an ItemList with every public profile in a category", async () => {
    const directory = await getPublicCategoryDirectory("celulares-y-accesorios");
    if (!directory) throw new Error("fixture missing");

    const schema = buildCategoryJsonLd(directory);
    const itemList = schema["@graph"].find((entry) => entry["@type"] === "ItemList");

    expect(itemList?.numberOfItems).toBe(2);
    expect(itemList?.itemListElement).toHaveLength(2);
  });

  it("escapes less-than characters before injecting JSON-LD into HTML", () => {
    expect(serializeJsonLd({ value: "</script>" })).toBe('{"value":"\\u003c/script>"}');
  });
});

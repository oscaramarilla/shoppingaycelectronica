import { describe, expect, it } from "vitest";
import {
  getPublicBusinessProfile,
  getPublicCategoryDirectory,
  listPublicBusinessProfiles,
  listPublicCatalogItems,
} from "./data";

describe("marketplace public data adapter", () => {
  it("returns a profile with its category, catalog and related profiles", async () => {
    const detail = await getPublicBusinessProfile("conecta-movil-demo");

    expect(detail?.profile.publicName).toBe("Conecta Móvil Demo");
    expect(detail?.category.slug).toBe("celulares-y-accesorios");
    expect(detail?.catalogItems).toHaveLength(2);
    expect(detail?.relatedProfiles.map(({ slug }) => slug)).toContain("mundo-accesorio-demo");
  });

  it("does not resolve unknown public slugs", async () => {
    await expect(getPublicBusinessProfile("no-existe")).resolves.toBeNull();
    await expect(getPublicCategoryDirectory("no-existe")).resolves.toBeNull();
  });

  it("keeps private rental and legal fields out of the public projection", async () => {
    const payload = JSON.stringify({
      profiles: await listPublicBusinessProfiles(),
      catalog: await listPublicCatalogItems(),
    });

    expect(payload).not.toContain("tenantName");
    expect(payload).not.toContain("tenant_name");
    expect(payload).not.toContain("monthlyRent");
    expect(payload).not.toContain("monthly_rent");
    expect(payload).not.toContain("expensa");
    expect(payload).not.toContain("beneficiary");
  });

  it("groups only matching profiles and items in a category", async () => {
    const directory = await getPublicCategoryDirectory("servicio-tecnico");

    expect(directory?.profiles).toHaveLength(1);
    expect(directory?.catalogItems).toHaveLength(2);
    expect(directory?.isDemo).toBe(true);
    expect(directory?.profiles.every(({ categorySlug }) => categorySlug === "servicio-tecnico")).toBe(true);
  });
});

import {
  mockBusinessProfiles,
  mockCatalogItems,
  mockCategories,
} from "./mock-data";
import type {
  BusinessProfile,
  BusinessProfileDetail,
  CatalogItem,
  CategoryDirectory,
  MarketplaceCategory,
} from "./types";

/**
 * Adaptador temporal de lectura pública.
 *
 * La UI consume estas funciones y no importa los mocks directamente. Cuando
 * Claude entregue las tablas, solo esta capa deberá migrar a Supabase.
 */
export async function listPublicBusinessProfiles(): Promise<BusinessProfile[]> {
  return mockBusinessProfiles.filter(({ isPublished }) => isPublished);
}

export async function listPublicCategories(): Promise<MarketplaceCategory[]> {
  return mockCategories;
}

export async function listPublicCatalogItems(): Promise<CatalogItem[]> {
  return mockCatalogItems.filter(({ isPublished }) => isPublished);
}

export async function getPublicBusinessProfile(
  slug: string,
): Promise<BusinessProfileDetail | null> {
  const profile = mockBusinessProfiles.find(
    (candidate) => candidate.slug === slug && candidate.isPublished,
  );
  if (!profile) return null;

  const category = mockCategories.find(
    (candidate) => candidate.slug === profile.categorySlug,
  );
  if (!category) return null;

  return {
    profile,
    category,
    catalogItems: mockCatalogItems.filter(
      (item) => item.businessProfileId === profile.id && item.isPublished,
    ),
    relatedProfiles: mockBusinessProfiles
      .filter(
        (candidate) =>
          candidate.id !== profile.id &&
          candidate.categorySlug === profile.categorySlug &&
          candidate.isPublished,
      )
      .slice(0, 3),
  };
}

export async function getPublicCategoryDirectory(
  slug: string,
): Promise<CategoryDirectory | null> {
  const category = mockCategories.find((candidate) => candidate.slug === slug);
  if (!category) return null;

  const profiles = mockBusinessProfiles.filter(
    (profile) => profile.categorySlug === category.slug && profile.isPublished,
  );

  return {
    category,
    profiles,
    catalogItems: mockCatalogItems.filter(
      (item) => item.categorySlug === category.slug && item.isPublished,
    ),
    otherCategories: mockCategories.filter(
      (candidate) => candidate.slug !== category.slug,
    ),
    isDemo:
      profiles.length > 0 &&
      profiles.every(({ isDemo }) => isDemo),
  };
}

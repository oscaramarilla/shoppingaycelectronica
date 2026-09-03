/**
 * Las cuatro empresas del Grupo AYC que operan en el 2do piso de la galería.
 *
 * No son salones comerciales en alquiler: son los negocios propios que respaldan
 * al shopping. Por eso viven en su propia sección y nunca en el directorio de
 * `AVAILABLE_UNITS_BY_FLOOR` ni en `getPublicUnits()`.
 *
 * `logo: null` renderiza el wordmark tipográfico de respaldo. Para publicar el
 * logo real, dejá el archivo en `public/images/grupo-ayc/` y apuntá `logo` a él.
 */
export type GroupCompany = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  /** Ruta dentro de /public, o null para usar el wordmark tipográfico. */
  logo: string | null;
};

export const GROUP_COMPANIES: readonly GroupCompany[] = [
  {
    slug: "aycweb",
    name: "AYCweb",
    tagline: "Desarrollo y Automatización",
    description:
      "Infraestructura agéntica y software B2B. Transformamos operaciones empresariales mediante consultoría digital y automatización de procesos a medida.",
    href: "https://www.aycweb.com/es",
    logo: "/images/grupo-ayc/aycweb.webp",
  },
  {
    slug: "ayc-srl",
    name: "A y C S.R.L.",
    tagline: "Mobiliario Escolar y Corporativo",
    description:
      "Más de 15 años diseñando ambientes de estudio y trabajo. Fabricación de sillas y mesas ergonómicas enfocadas en confort, durabilidad y salud postural.",
    href: "https://ayc.com.py/",
    logo: "/images/grupo-ayc/ayc-srl.png",
  },
  {
    slug: "metal-mad",
    name: "Metal Mad",
    tagline: "Mobiliario Inyectado Industrial",
    description:
      "Fábrica de infraestructura educativa de alto rendimiento. Producción a gran escala con polipropileno de alta densidad y cumplimiento estricto de normas oficiales.",
    href: "https://metalmadeas.com/",
    logo: "/images/grupo-ayc/metal-mad.webp",
  },
  {
    slug: "oriplast",
    name: "Oriplast PY",
    tagline: "Inyección Plástica y Componentes",
    description:
      "Representación comercial oficial y logística de piezas inyectadas. Proveedor clave de componentes industriales con altos estándares de calidad internacional.",
    href: "https://oriplastpy.com/",
    // oriplastpy.com no publica un logo propio descargable todavía.
    logo: null,
  },
] as const;

export const GROUP_COMPANY_COUNT = GROUP_COMPANIES.length;

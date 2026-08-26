# Preparación de datos para las fichas de los locatarios

La importación se divide en cuatro archivos para no mezclar la contabilidad privada
con el contenido público del marketplace.

## 1. `locales-inquilinos.csv`

Una fila por salón. `unit_code` es la clave humana estable (por ejemplo `PB-01`).
Este archivo es exclusivamente administrativo.

- **Privado/admin:** `tenant_legal_name`, `private_phone`, `monthly_rent_pyg`, `due_day`.

## 2. `perfiles-comerciales.csv`

Una fila por marca o comercio público. Un mismo `unit_code` puede repetirse: por
ejemplo, MetalMadeas y Oriplast pueden compartir showroom y mantener fichas,
catálogos y WhatsApp independientes.

`is_published` debe ser `false` hasta contar con autorización y revisar la ficha.

## 3. `ofertas.csv`

Una fila por producto o servicio. Varios registros pueden usar el mismo
`profile_slug`. `price_pyg` queda vacío cuando corresponde cotización y
`price_label` explica lo que verá el visitante.

## 4. `fotos.csv`

Una fila por imagen. Las fotos se suben primero al storage y aquí se registra su
URL, texto alternativo y orden por `profile_slug`. Solo usar material autorizado
por el comercio.

## Flujo de importación

1. Validar códigos, estados, pisos, teléfonos y montos.
2. Importar/actualizar `units` por `code`, nunca por UUID externo.
3. Crear uno o varios perfiles y mapearlos al UUID interno de `units`.
4. Importar ofertas y fotos por `profile_slug`.
5. Revisar cada ficha en preview.
6. Cambiar `is_published` a `true` únicamente después de la aprobación.

Los datos marcados `DEMO` son solamente ejemplos de formato y no deben cargarse
en producción.

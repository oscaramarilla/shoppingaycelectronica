# Relevamiento REAL de la galería — datos + instrucción para Codex

> Interpretado de la planilla de la secretaría (`Informe galeria Oscar.xlsx`),
> 2026-08-27. **Datos PRIVADOS** (nombres legales, alquileres): viven en el repo
> privado solo para importar a `units`. **Nunca** van al sitio público.

## 1. Estructura real del shopping (3 niveles)
- **Planta Baja** — comercial. Salones 1–26 (+ "bajo escalera"). 26 unidades.
- **Planta Alta** — comercial. Salones 31–54. 24 unidades. *(en la planilla figura como "Primer Piso").*
- **2do Piso** — **administración**: oficinas de Oscar, su padre, la secretaria, la tía Zully, Propisur, y **los 4 negocios propios** (metalmadeas.com, oriplastpy.com, ayc.com.py, aycweb.com). **NO son locales comerciales para alquilar** → van en "AYC Empresas", no en el directorio de salones.

## 2. Datos (archivo: `docs/data/locales-reales.csv`)
50 unidades comerciales (26 PB + 24 PA). Columnas → tabla `units`:
`unit_code`→code · `floor` · `status` · `tenant_legal_name`→**tenant_name (privado)** ·
`monthly_rent_pyg`→monthly_rent · `expensa_pyg`→**expensa (nuevo)** · `beneficiario` (nuevo) ·
`canal_alquiler` (nuevo) · `notas`.

## 3. Reglas de negocio (confirmadas por Oscar)
- **Zully (tía de Oscar):** sus 8 salones (PB-10/17/20/21/22/23, PA-43/53/54) están ocupados pero **el alquiler lo recibe ELLA** (herencia familiar del abuelo). `beneficiario='zully'` → **excluir de los cobros del padre**.
- **Propisur:** inmobiliaria; algunos salones se alquilan por ese canal (y les consigue clientes). `canal_alquiler` = `directo` o `propisur`. **Hoy está vacío: la secretaria debe etiquetarlo por salón.**
- **Multi-salón:** un negocio ocupa varios salones (Jihad Ali 5, Federico 2, Guebara 2). El alquiler+expensa combinado se cargó en el primer salón (ej. PB-04) con nota; los demás quedan en blanco con nota "combinado con …".
- **Alquiler + Expensa** son dos conceptos que se cobran por separado.

## 4. Vacancias (21 salones disponibles) — la oportunidad
- **Planta Baja (4):** PB-11, PB-16, PB-19, PB-26.
- **Planta Alta (17):** PA-31→36, PA-39, PA-42, PA-44→52.
El **Primer Piso está ~70% vacío** → debe ser un flujo destacado ("Salones disponibles / Quiero alquilar") en el sitio y en el panel.

## 5. ⚠️ Arreglo de PRIVACIDAD requerido (importante)
Hoy `units.tenant_name` **se expone en la proyección pública** (`UNIT_PUBLIC_COLUMNS` en `lib/directory/types.ts`). Como ahora vamos a cargar **nombres legales reales**, hay que **sacar `tenant_name` de la proyección pública** — el nombre legal es PRIVADO. El nombre público (marca comercial) vendrá de `business_profiles`, no de `units`. Hasta tener perfiles, el directorio público muestra salón/piso/estado/categoría, **sin nombre**.

## 6. Instrucción del PRÓXIMO PASO (para Codex)
En una rama nueva (un feature = un PR):
1. **Migración:** correr `docs/sql/units-galeria-fields.sql` (agrega `expensa`, `beneficiario`, `canal_alquiler`).
2. **Privacidad:** quitar `tenant_name` de `UNIT_PUBLIC_COLUMNS` / `UnitPublic` (`lib/directory/types.ts`) y de la portada. El nombre legal nunca sale público.
3. **Importar** `docs/data/locales-reales.csv` a `units` (mapear por `unit_code`). Los campos privados (nombre legal, alquiler, expensa) solo por endpoints admin.
4. **Panel `/gestion`:**
   - Cobros = **alquiler + expensa**.
   - **Excluir** `beneficiario='zully'` del total de cobros del padre (mostrarlos aparte, informativos).
   - Vista de **vacancias** (21 disponibles) para el embudo "Quiero alquilar".
   - Mostrar `canal_alquiler` (directo/propisur) para atribución.
5. **Copia pública:** corregir la portada a **3 niveles reales** (PB y PA comerciales + 2do administración). El conteo debe reflejar la realidad (**50 salones comerciales, 21 disponibles**) — sin cifras infladas tipo "75 locales".
6. **NO cargar todavía** `business_profiles`/productos/fotos: eso viene del relevamiento que Oscar arranca mañana, inquilino por inquilino, con autorización.

## 7. Pendiente de Oscar (relevamiento, desde mañana)
Hablar con cada inquilino y conseguir (con autorización): **marca comercial, WhatsApp público, categoría, productos/servicios/precios, fotos**. Y que la secretaria complete **teléfonos** y **`canal_alquiler`** (directo/propisur) en `units`.

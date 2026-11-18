/**
 * Capa de Persistencia Canónica del Ecosistema Inthaly (PostgreSQL 16)
 * 
 * Exporta clientes de base de datos estrictamente segregados por responsabilidad:
 * - inthalyIdSql: Identidades, credenciales, sesiones y proveedores OIDC.
 * - inthalyCommunitySql: Perfiles profesionales, foros, grupos y publicaciones.
 */

export { inthalyIdSql, checkInthalyIdDbHealth } from './inthaly-id-db'
export { inthalyCommunitySql, checkCommunityDbHealth } from './community-db'

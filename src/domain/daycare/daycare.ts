/**
 * Identifies a persisted domain entity as belonging to a daycare tenant.
 */
export type DaycareScoped = {
  daycareId: string;
};

/**
 * Checks whether an entity belongs to the requested daycare.
 *
 * @param entity - Entity whose tenant must be checked.
 * @param daycareId - Daycare identifier to compare against.
 * @returns Whether the entity belongs to the requested daycare.
 */
export function belongsToDaycare(
  entity: DaycareScoped,
  daycareId: string,
): boolean {
  return entity.daycareId === daycareId;
}

/**
 * Checks whether two entities belong to the same daycare.
 *
 * @param first - First entity whose tenant must be compared.
 * @param second - Second entity whose tenant must be compared.
 * @returns Whether both entities belong to the same daycare.
 */
export function areInSameDaycare(
  first: DaycareScoped,
  second: DaycareScoped,
): boolean {
  return first.daycareId === second.daycareId;
}

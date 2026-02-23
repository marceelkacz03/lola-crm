export const relationName = (relation: unknown, fallback = "Account"): string => {
  if (Array.isArray(relation)) {
    const first = relation[0] as { name?: unknown } | undefined;
    return typeof first?.name === "string" ? first.name : fallback;
  }

  if (relation && typeof relation === "object") {
    const maybe = relation as { name?: unknown };
    return typeof maybe.name === "string" ? maybe.name : fallback;
  }

  return fallback;
};

export function normalizeProjectText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export function normalizeOptionalProjectText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeProjectSlug(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return slugifyProjectValue(value);
}

export function normalizeProjectStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const entry of value) {
    if (typeof entry !== 'string') {
      normalizedValues.push(entry as never);
      continue;
    }

    const normalized = entry.trim();

    if (!normalized) {
      continue;
    }

    const dedupeKey = normalized.toLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
}

export function slugifyProjectValue(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

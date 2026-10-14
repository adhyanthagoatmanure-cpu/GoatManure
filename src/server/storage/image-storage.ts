import { randomUUID } from "node:crypto";

export const IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_REQUEST_LIMIT_BYTES = 55 * 1024 * 1024;
export const IMAGE_KINDS = ["products", "blogs", "profiles"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXTENSIONS).map(([mime, extension]) => [extension.slice(1), mime]),
);

export interface StoredImage {
  key: string;
  url: string;
  contentType: string;
}

export interface StoredObject {
  key: string;
  contentType?: string;
}

export interface ImageObjectStore {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Uint8Array; contentType?: string } | null>;
  head(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(prefix: string, continuationToken?: string): Promise<{
    objects: StoredObject[];
    continuationToken?: string;
  }>;
}

export function imageExtensionForMime(mimeType: string): string | null {
  return MIME_EXTENSIONS[mimeType] ?? null;
}

export function imageMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    String.fromCharCode(...bytes.subarray(0, 6)).match(/^GIF8[79]a$/)
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function managedImageKey(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url, "https://adhyantha.invalid").pathname;
  } catch {
    return null;
  }
  const match = pathname.match(
    /^\/api\/storage\/(products|blogs|profiles)\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|gif))$/i,
  );
  return match ? `uploads/${match[1]}/${match[2]}` : null;
}

export function imageUrlForKey(key: string): string | null {
  const match = key.match(/^uploads\/(products|blogs|profiles)\/([^/]+)$/);
  if (!match || !/^[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/i.test(match[2])) return null;
  return `/api/storage/${match[1]}/${match[2]}`;
}

export function imageStorageFailureDetails(error: unknown): {
  category: string;
  databaseCode?: string;
} {
  const databaseCode =
    error && typeof error === "object" && "code" in error &&
    typeof error.code === "string" && /^P\d{4}$/.test(error.code)
      ? error.code
      : undefined;
  return {
    category: databaseCode === "P2021" || databaseCode === "P2022"
      ? "database_schema_missing"
      : "database_storage_failure",
    ...(databaseCode ? { databaseCode } : {}),
  };
}

export function imageStorageFailureMessage(details: ReturnType<typeof imageStorageFailureDetails>): {
  code: string;
  message: string;
} {
  switch (details.category) {
    case "database_schema_missing":
      return {
        code: "IMAGE_STORAGE_TABLE_MISSING",
        message: "Image storage is not set up in MySQL yet. Apply the latest Prisma database migration, then retry.",
      };
    default:
      return {
        code: "IMAGE_DATABASE_UNAVAILABLE",
        message: "Could not save the image in the GoDaddy MySQL database. Check the database connection and retry.",
      };
  }
}

export async function storeImage(
  store: ImageObjectStore,
  kind: ImageKind,
  bytes: Uint8Array,
  declaredMimeType: string,
): Promise<StoredImage> {
  if (bytes.length === 0 || bytes.length > IMAGE_LIMIT_BYTES) {
    throw new Error("Each image must be non-empty and smaller than 5 MB");
  }
  const extension = imageExtensionForMime(declaredMimeType);
  const actualMimeType = imageMimeFromBytes(bytes);
  if (!extension || actualMimeType !== declaredMimeType) {
    throw new Error("Image content does not match an allowed image type");
  }

  const filename = `${randomUUID()}${extension}`;
  const key = `uploads/${kind}/${filename}`;
  await store.put(key, bytes, declaredMimeType);
  return { key, url: `/api/storage/${kind}/${filename}`, contentType: declaredMimeType };
}

export function validateStoredImageKey(key: string): boolean {
  return imageUrlForKey(key) !== null;
}

function expectedMimeForKey(key: string): string | null {
  const extension = key.split(".").pop()?.toLowerCase();
  return extension ? MIME_BY_EXTENSION[extension] ?? null : null;
}

export interface CleanupResult {
  scanned: number;
  candidates: string[];
  deleted: string[];
  skipped: number;
  failed: string[];
}

export async function cleanupUnusedImages(
  store: ImageObjectStore,
  referencedUrls: Iterable<string>,
  dryRun: boolean,
): Promise<CleanupResult> {
  const referencedKeys = new Set(
    Array.from(referencedUrls, managedImageKey).filter((key): key is string => key !== null),
  );
  const result: CleanupResult = { scanned: 0, candidates: [], deleted: [], skipped: 0, failed: [] };

  for (const kind of IMAGE_KINDS) {
    let continuationToken: string | undefined;
    do {
      const page = await store.list(`uploads/${kind}/`, continuationToken);
      result.scanned += page.objects.length;
      for (const object of page.objects) {
        if (!validateStoredImageKey(object.key)) {
          result.skipped += 1;
          continue;
        }
        if (referencedKeys.has(object.key)) continue;
        try {
          if ((await store.head(object.key)) !== expectedMimeForKey(object.key)) {
            result.skipped += 1;
            continue;
          }
        } catch {
          console.error(`[image-cleanup] Failed to verify managed image type ${object.key}`);
          result.failed.push(object.key);
          continue;
        }

        result.candidates.push(object.key);
        if (dryRun) continue;
        try {
          await store.delete(object.key);
          result.deleted.push(object.key);
        } catch {
          console.error(`[image-cleanup] Failed to delete managed image ${object.key}`);
          result.failed.push(object.key);
        }
      }
      continuationToken = page.continuationToken;
    } while (continuationToken);
  }

  return result;
}

export async function deleteImagesIfUnreferenced(
  store: ImageObjectStore,
  urls: string[],
  referencedUrls: Iterable<string>,
): Promise<{ deleted: string[]; referenced: string[]; ignored: number; failed: string[] }> {
  const referencedKeys = new Set(
    Array.from(referencedUrls, managedImageKey).filter((key): key is string => key !== null),
  );
  const keys = new Set(urls.map(managedImageKey).filter((key): key is string => key !== null));
  const result = { deleted: [] as string[], referenced: [] as string[], ignored: 0, failed: [] as string[] };

  result.ignored = urls.length - keys.size;
  for (const key of keys) {
    if (referencedKeys.has(key)) {
      result.referenced.push(key);
      continue;
    }
    try {
      if ((await store.head(key)) !== expectedMimeForKey(key)) {
        result.failed.push(key);
        console.error(`[image-storage] Refusing to delete an unverified managed image ${key}`);
        continue;
      }
      await store.delete(key);
      result.deleted.push(key);
    } catch {
      console.error(`[image-storage] Failed to delete unreferenced managed image ${key}`);
      result.failed.push(key);
    }
  }
  return result;
}

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

function getR2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  const missing = [
    ["R2_ACCOUNT_ID", R2_ACCOUNT_ID],
    ["R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET_NAME", R2_BUCKET_NAME],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Image storage is not configured: missing ${missing.join(", ")}`);
  }
  return {
    accountId: R2_ACCOUNT_ID!,
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    bucketName: R2_BUCKET_NAME!,
  };
}

export function imageStorageFailureDetails(error: unknown): {
  category: string;
  status?: number;
  providerCode?: string;
  missingConfig?: string[];
} {
  const message = error instanceof Error ? error.message : "";
  const missingConfigMatch = message.match(
    /^Image storage is not configured: missing ((?:R2_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_BUCKET_NAME)(?:, (?:R2_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_BUCKET_NAME))*)$/,
  );
  if (missingConfigMatch) {
    return {
      category: "configuration_missing",
      missingConfig: missingConfigMatch[1].split(", "),
    };
  }

  const metadata =
    error && typeof error === "object" && "$metadata" in error
      ? (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata
      : undefined;
  const status =
    typeof metadata?.httpStatusCode === "number" ? metadata.httpStatusCode : undefined;
  const providerCode =
    error && typeof error === "object" && "name" in error &&
    typeof error.name === "string" &&
    /^(AccessDenied|InvalidAccessKeyId|SignatureDoesNotMatch|NoSuchBucket|BucketNotFound|SlowDown|RequestTimeout|TimeoutError|NetworkingError)$/.test(error.name)
      ? error.name
      : undefined;

  if (status === 401 || status === 403 || providerCode === "AccessDenied" || providerCode === "InvalidAccessKeyId" || providerCode === "SignatureDoesNotMatch") {
    return {
      category: "provider_authorization",
      ...(status === undefined ? {} : { status }),
      ...(providerCode ? { providerCode } : {}),
    };
  }
  if (status === 404 || providerCode === "NoSuchBucket" || providerCode === "BucketNotFound") {
    return {
      category: "bucket_or_object_not_found",
      ...(status === undefined ? {} : { status }),
      ...(providerCode ? { providerCode } : {}),
    };
  }
  if (status === 429 || providerCode === "SlowDown") {
    return {
      category: "provider_rate_limited",
      ...(status === undefined ? {} : { status }),
      ...(providerCode ? { providerCode } : {}),
    };
  }
  if (status && status >= 500) {
    return {
      category: "provider_server_error",
      status,
      ...(providerCode ? { providerCode } : {}),
    };
  }
  if (providerCode === "TimeoutError" || providerCode === "RequestTimeout" || providerCode === "NetworkingError") {
    return {
      category: "network_or_timeout",
      ...(status === undefined ? {} : { status }),
      providerCode,
    };
  }
  return {
    category: "unknown_storage_failure",
    ...(status === undefined ? {} : { status }),
    ...(providerCode ? { providerCode } : {}),
  };
}

export function imageStorageFailureMessage(details: ReturnType<typeof imageStorageFailureDetails>): {
  code: string;
  message: string;
} {
  switch (details.category) {
    case "configuration_missing":
      return {
        code: "IMAGE_STORAGE_NOT_CONFIGURED",
        message: `Product image storage is not configured. Set the missing server-side R2 settings: ${details.missingConfig?.join(", ") ?? "R2 configuration"}.`,
      };
    case "provider_authorization":
      return {
        code: "IMAGE_STORAGE_ACCESS_DENIED",
        message: "Cloud image storage rejected the upload. Check the R2 credentials and bucket write permissions.",
      };
    case "bucket_or_object_not_found":
      return {
        code: "IMAGE_STORAGE_BUCKET_NOT_FOUND",
        message: "The configured image storage bucket was not found. Check the R2 account and bucket settings.",
      };
    default:
      return {
        code: "IMAGE_STORAGE_UNAVAILABLE",
        message: "Could not store product images. Check the image storage service and retry.",
      };
  }
}

let s3Client: S3Client | undefined;

function getS3Client() {
  if (!s3Client) {
    const config = getR2Config();
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

function bucketName() {
  return getR2Config().bucketName;
}

export function createR2ImageStore(): ImageObjectStore {
  return {
    async put(key, body, contentType) {
      await getS3Client().send(
        new PutObjectCommand({ Bucket: bucketName(), Key: key, Body: body, ContentType: contentType }),
      );
    },
    async get(key) {
      try {
        const result = await getS3Client().send(
          new GetObjectCommand({ Bucket: bucketName(), Key: key }),
        );
        if (!result.Body) return null;
        return {
          body: await result.Body.transformToByteArray(),
          contentType: result.ContentType,
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "$metadata" in error &&
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
        ) {
          return null;
        }
        throw error;
      }
    },
    async head(key) {
      try {
        const result = await getS3Client().send(
          new HeadObjectCommand({ Bucket: bucketName(), Key: key }),
        );
        return result.ContentType ?? null;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "$metadata" in error &&
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
        ) {
          return null;
        }
        throw error;
      }
    },
    async delete(key) {
      await getS3Client().send(
        new DeleteObjectCommand({ Bucket: bucketName(), Key: key }),
      );
    },
    async list(prefix, continuationToken) {
      const result = await getS3Client().send(
        new ListObjectsV2Command({
          Bucket: bucketName(),
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      return {
        objects: (result.Contents ?? []).flatMap((object) =>
          object.Key ? [{ key: object.Key, contentType: undefined }] : [],
        ),
        continuationToken: result.IsTruncated ? result.NextContinuationToken : undefined,
      };
    },
  };
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

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanupUnusedImages,
  deleteImagesIfUnreferenced,
  imageExtensionForMime,
  imageMimeFromBytes,
  imageUrlForKey,
  managedImageKey,
  storeImage,
  type ImageObjectStore,
} from "../src/server/storage/image-storage";
import { mergeProductImageUrls } from "../src/lib/utils";

class MemoryImageStore implements ImageObjectStore {
  readonly objects = new Map<string, { body: Uint8Array; contentType: string }>();

  async put(key: string, body: Uint8Array, contentType: string) {
    this.objects.set(key, { body, contentType });
  }

  async get(key: string) {
    const object = this.objects.get(key);
    return object ? { body: object.body, contentType: object.contentType } : null;
  }

  async head(key: string) {
    return this.objects.get(key)?.contentType ?? null;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }

  async list(prefix: string) {
    return {
      objects: [...this.objects.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, object]) => ({ key, contentType: object.contentType })),
    };
  }
}

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

test("stores a signature-checked image and retrieves the same bytes through its stable URL key", async () => {
  const store = new MemoryImageStore();
  const uploaded = await storeImage(store, "products", pngBytes, "image/png");

  assert.match(uploaded.url, /^\/api\/storage\/products\/[0-9a-f-]{36}\.png$/i);
  assert.equal(managedImageKey(uploaded.url), uploaded.key);
  assert.equal(imageUrlForKey(uploaded.key), uploaded.url);
  assert.deepEqual((await store.get(uploaded.key))?.body, pngBytes);
});

test("rejects MIME/signature mismatches and unsupported extensions", async () => {
  assert.equal(imageExtensionForMime("image/svg+xml"), null);
  assert.equal(imageMimeFromBytes(jpegBytes), "image/jpeg");
  await assert.rejects(storeImage(new MemoryImageStore(), "products", jpegBytes, "image/png"));
  await assert.rejects(storeImage(new MemoryImageStore(), "products", pngBytes, "image/svg+xml"));
});

test("dry-run cleanup reports only unreferenced managed files and skips unknown keys", async () => {
  const store = new MemoryImageStore();
  const retained = await storeImage(store, "products", pngBytes, "image/png");
  const orphan = await storeImage(store, "blogs", jpegBytes, "image/jpeg");
  await store.put("uploads/products/unknown.exe", new Uint8Array([1]), "application/octet-stream");
  await store.put(
    "uploads/profiles/123e4567-e89b-42d3-a456-426614174000.png",
    new Uint8Array([1]),
    "application/octet-stream",
  );

  const report = await cleanupUnusedImages(store, [retained.url], true);

  assert.deepEqual(report.candidates, [orphan.key]);
  assert.equal(report.deleted.length, 0);
  assert.equal(report.skipped, 2);
  assert.equal(store.objects.has(orphan.key), true);
});

test("delete mode removes only confirmed unreferenced files and retains shared image references", async () => {
  const store = new MemoryImageStore();
  const shared = await storeImage(store, "products", pngBytes, "image/png");
  const orphan = await storeImage(store, "products", jpegBytes, "image/jpeg");

  const result = await deleteImagesIfUnreferenced(
    store,
    [shared.url, orphan.url],
    [`https://shop.example${shared.url}`],
  );

  assert.deepEqual(result.referenced, [shared.key]);
  assert.deepEqual(result.deleted, [orphan.key]);
  assert.equal(store.objects.has(shared.key), true);
  assert.equal(store.objects.has(orphan.key), false);
});

test("product edits keep existing images and append new uploads", () => {
  assert.deepEqual(
    mergeProductImageUrls(["/images/products/legacy.svg", "/api/storage/products/old.jpg"], ["/api/storage/products/new.jpg"]),
    ["/images/products/legacy.svg", "/api/storage/products/old.jpg", "/api/storage/products/new.jpg"],
  );
});

test("an upload is removed after a failed database save but retained if the save committed", async () => {
  const store = new MemoryImageStore();
  const uploaded = await storeImage(store, "products", pngBytes, "image/png");
  const cleanupAfterFailedSave = await deleteImagesIfUnreferenced(store, [uploaded.url], []);
  assert.deepEqual(cleanupAfterFailedSave.deleted, [uploaded.key]);

  const committedUpload = await storeImage(store, "products", jpegBytes, "image/jpeg");
  const cleanupAfterCommittedSave = await deleteImagesIfUnreferenced(
    store,
    [committedUpload.url],
    [committedUpload.url],
  );
  assert.deepEqual(cleanupAfterCommittedSave.referenced, [committedUpload.key]);
  assert.equal(store.objects.has(committedUpload.key), true);
});

test("shared customer or order-related image references protect files from cleanup", async () => {
  const store = new MemoryImageStore();
  const image = await storeImage(store, "products", pngBytes, "image/png");
  const result = await cleanupUnusedImages(store, [image.url], false);

  assert.equal(result.deleted.length, 0);
  assert.equal(store.objects.has(image.key), true);
});

test("legacy paths and malformed URLs are never interpreted as managed object keys", () => {
  assert.equal(managedImageKey("/images/products/uploads/legacy.jpg"), null);
  assert.equal(managedImageKey("/api/storage/products/../../secret.jpg"), null);
  assert.equal(managedImageKey("/api/storage/products/not-a-uuid.jpg"), null);
  assert.equal(imageUrlForKey("uploads/products/not-a-uuid.jpg"), null);
});

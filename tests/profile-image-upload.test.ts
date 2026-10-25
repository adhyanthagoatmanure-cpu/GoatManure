import assert from "node:assert/strict";
import { test } from "node:test";
import {
  handleProfileImageUpload,
  type ProfileImageUploadDependencies,
} from "../src/server/storage/profile-image-upload";
import { managedImageKey, type ImageObjectStore } from "../src/server/storage/image-storage";

const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

class MemoryImageStore implements ImageObjectStore {
  readonly objects = new Map<string, Uint8Array>();

  async put(key: string, body: Uint8Array) {
    this.objects.set(key, body);
  }

  async get(key: string) {
    const body = this.objects.get(key);
    return body ? { body, contentType: "image/png" } : null;
  }

  async head(key: string) {
    return this.objects.has(key) ? "image/png" : null;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }

  async list(prefix: string) {
    return {
      objects: [...this.objects.keys()]
        .filter((key) => key.startsWith(prefix))
        .map((key) => ({ key, contentType: "image/png" })),
    };
  }
}

function requestWithFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/account/profile/image", {
    method: "POST",
    body: formData,
  });
}

function createDependencies(
  overrides: Partial<ProfileImageUploadDependencies> = {},
): ProfileImageUploadDependencies {
  return {
    authenticate: async () => "signed-in-user",
    findUserImage: async () => ({ image: null }),
    createStore: () => new MemoryImageStore(),
    saveImage: async () => {},
    deleteIfUnreferenced: async () => {},
    logError: () => {},
    ...overrides,
  };
}

test("rejects unauthenticated uploads before parsing or storing the file", async () => {
  const result = await handleProfileImageUpload(
    new Request("http://localhost/api/account/profile/image", { method: "POST" }),
    createDependencies({ authenticate: async () => null }),
  );

  assert.equal(result.status, 401);
});

test("rejects unsupported image types and files larger than 2 MB", async () => {
  const unsupported = await handleProfileImageUpload(
    requestWithFile(new File([pngBytes], "image.svg", { type: "image/svg+xml" })),
    createDependencies(),
  );
  const oversized = await handleProfileImageUpload(
    requestWithFile(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })),
    createDependencies(),
  );

  assert.equal(unsupported.status, 400);
  assert.equal(oversized.status, 413);
});

test("rejects image data whose signature does not match its declared MIME type", async () => {
  const result = await handleProfileImageUpload(
    requestWithFile(new File([new Uint8Array([1, 2, 3])], "not-an-image.png", { type: "image/png" })),
    createDependencies(),
  );

  assert.equal(result.status, 400);
});

test("stores the image and saves its URL only for the authenticated user's record", async () => {
  const store = new MemoryImageStore();
  let savedForUser = "";
  let savedUrl = "";
  const result = await handleProfileImageUpload(
    requestWithFile(new File([pngBytes], "profile.png", { type: "image/png" })),
    createDependencies({
      createStore: () => store,
      saveImage: async (userId, imageUrl) => {
        savedForUser = userId;
        savedUrl = imageUrl;
      },
    }),
  );

  assert.equal(result.status, 201);
  assert.equal(savedForUser, "signed-in-user");
  assert.equal(result.body.image, savedUrl);
  assert.equal(store.objects.size, 1);
  assert.match(savedUrl, /^\/api\/storage\/profiles\/[0-9a-f-]{36}\.png$/i);
});

test("returns a safe migration diagnostic and logs the actual storage exception", async () => {
  const error = Object.assign(new Error("missing stored_images table"), { code: "P2021" });
  let loggedError: unknown;
  const result = await handleProfileImageUpload(
    requestWithFile(new File([pngBytes], "profile.png", { type: "image/png" })),
    createDependencies({
      createStore: () => ({
        put: async () => { throw error; },
        get: async () => null,
        head: async () => null,
        delete: async () => {},
        list: async () => ({ objects: [] }),
      }),
      logError: (_message, actualError) => { loggedError = actualError; },
    }),
  );

  assert.equal(result.status, 503);
  assert.equal(result.body.code, "IMAGE_STORAGE_TABLE_MISSING");
  assert.equal(loggedError, error);
});

test("cleans up a stored object if saving its URL to the user record fails", async () => {
  const store = new MemoryImageStore();
  let cleanupUrls: string[] = [];
  const result = await handleProfileImageUpload(
    requestWithFile(new File([pngBytes], "profile.png", { type: "image/png" })),
    createDependencies({
      createStore: () => store,
      saveImage: async () => { throw new Error("user update failed"); },
      deleteIfUnreferenced: async (urls) => {
        cleanupUrls = urls;
        for (const url of urls) {
          const key = managedImageKey(url);
          if (key) await store.delete(key);
        }
      },
    }),
  );

  assert.equal(result.status, 503);
  assert.equal(store.objects.size, 0);
  assert.equal(cleanupUrls.length, 1);
});

import {
  imageExtensionForMime,
  imageMimeFromBytes,
  imageStorageFailureDetails,
  imageStorageFailureMessage,
  storeImage,
  type ImageObjectStore,
} from "@/server/storage/image-storage";

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_PROFILE_IMAGE_BYTES + 64 * 1024;

type UploadResponse = {
  status: number;
  body: Record<string, string>;
};

export interface ProfileImageUploadDependencies {
  authenticate(): Promise<string | null>;
  findUserImage(userId: string): Promise<{ image: string | null } | null>;
  createStore(): ImageObjectStore;
  saveImage(userId: string, imageUrl: string): Promise<void>;
  deleteIfUnreferenced(urls: string[]): Promise<unknown>;
  logError(message: string, error: unknown): void;
}

function failureResponse(error: unknown): UploadResponse {
  return {
    status: 503,
    body: imageStorageFailureMessage(imageStorageFailureDetails(error)),
  };
}

export async function handleProfileImageUpload(
  request: Request,
  dependencies: ProfileImageUploadDependencies,
): Promise<UploadResponse> {
  const userId = await dependencies.authenticate();
  if (!userId) return { status: 401, body: { error: "You must be signed in" } };

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { status: 413, body: { error: "Profile image must be smaller than 2 MB" } };
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { status: 400, body: { error: "Invalid image upload" } };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: 400, body: { error: "Choose a profile image" } };
  }
  if (!imageExtensionForMime(file.type)) {
    return { status: 400, body: { error: "Only JPG, PNG, WEBP, and GIF images are allowed" } };
  }
  if (file.size === 0) {
    return { status: 400, body: { error: "Choose a non-empty image" } };
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return { status: 413, body: { error: "Profile image must be smaller than 2 MB" } };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { status: 400, body: { error: "Could not read the uploaded image" } };
  }
  if (imageMimeFromBytes(bytes) !== file.type) {
    return { status: 400, body: { error: "Image content does not match its file type" } };
  }

  let existing: { image: string | null } | null;
  try {
    existing = await dependencies.findUserImage(userId);
  } catch (error) {
    dependencies.logError("Profile image owner lookup failed", error);
    return failureResponse(error);
  }
  if (!existing) return { status: 404, body: { error: "User not found" } };

  let uploadedUrl: string | undefined;
  let savedImageUrl: string;
  try {
    const stored = await storeImage(dependencies.createStore(), "profiles", bytes, file.type);
    uploadedUrl = stored.url;
    await dependencies.saveImage(userId, stored.url);
    savedImageUrl = stored.url;
  } catch (error) {
    if (uploadedUrl) {
      try {
        await dependencies.deleteIfUnreferenced([uploadedUrl]);
      } catch (cleanupError) {
        dependencies.logError("Failed to clean up a profile image after a database failure", cleanupError);
      }
    }
    dependencies.logError("Profile image upload or save failed", error);
    return failureResponse(error);
  }

  if (existing.image && existing.image !== savedImageUrl) {
    try {
      await dependencies.deleteIfUnreferenced([existing.image]);
    } catch (error) {
      dependencies.logError("Failed to clean up a replaced profile image", error);
    }
  }
  return { status: 201, body: { image: savedImageUrl } };
}

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const PLAYER_PHOTO_DIR = join(process.cwd(), 'static', 'uploads', 'players');
const PLAYER_PHOTO_URL_PREFIX = '/uploads/players';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif'
};

const getExtensionForMime = (mimeType: string): string => {
	return MIME_TO_EXTENSION[mimeType] ?? 'jpg';
};

const assertSupportedMimeType = (mimeType: string): void => {
	if (!(mimeType in MIME_TO_EXTENSION)) {
		throw new Error('Unsupported image type');
	}
};

const writePhotoFile = async (content: Uint8Array, mimeType: string): Promise<string> => {
	assertSupportedMimeType(mimeType);
	await mkdir(PLAYER_PHOTO_DIR, { recursive: true });

	const extension = getExtensionForMime(mimeType);
	const fileName = `${randomUUID()}.${extension}`;
	const filePath = join(PLAYER_PHOTO_DIR, fileName);
	await writeFile(filePath, content);

	return `${PLAYER_PHOTO_URL_PREFIX}/${fileName}`;
};

export const savePlayerPhotoFromUpload = async (photo: File): Promise<string> => {
	if (!photo.type.startsWith('image/')) {
		throw new Error('Uploaded file is not an image');
	}
	if (photo.size <= 0 || photo.size > MAX_IMAGE_SIZE_BYTES) {
		throw new Error('Invalid image size');
	}

	const bytes = new Uint8Array(await photo.arrayBuffer());
	return writePhotoFile(bytes, photo.type);
};

export const savePlayerPhotoFromDataUrl = async (photoDataUrl: string): Promise<string> => {
	const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(photoDataUrl);
	if (!dataUrlMatch) {
		throw new Error('Invalid data URL format');
	}

	const mimeType = dataUrlMatch[1];
	const base64Payload = dataUrlMatch[2];
	const bytes = Buffer.from(base64Payload, 'base64');

	if (bytes.byteLength <= 0 || bytes.byteLength > MAX_IMAGE_SIZE_BYTES) {
		throw new Error('Invalid image size');
	}

	return writePhotoFile(bytes, mimeType);
};

export const deletePlayerPhotoFile = async (
	photoPath: string | null | undefined
): Promise<void> => {
	if (!photoPath || !photoPath.startsWith(`${PLAYER_PHOTO_URL_PREFIX}/`)) {
		return;
	}

	const fileName = basename(photoPath);
	const filePath = join(PLAYER_PHOTO_DIR, fileName);
	await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	});
};

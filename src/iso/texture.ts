import type { TextureSource } from "./types";

export function shouldFlipNormalY(filename: string): boolean {
	return /nor[_-]?dx|directx/.test(filename.toLowerCase());
}

export function shortName(name: string): string {
	return name.replace(/-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, "");
}

function textureFromCanvas(
	canvas: HTMLCanvasElement,
	name: string,
): TextureSource {
	const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
	return {
		name,
		canvas,
		data: ctx.getImageData(0, 0, canvas.width, canvas.height),
	};
}

export async function textureFromFile(file: File): Promise<TextureSource> {
	const url = URL.createObjectURL(file);
	try {
		const img = await loadImage(url);
		const canvas = document.createElement("canvas");
		const max = 2048;
		const scale = Math.min(
			1,
			max / Math.max(img.naturalWidth, img.naturalHeight),
		);
		canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
		const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
		ctx.imageSmoothingEnabled = scale < 1;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		const name = file.name.replace(/\.[^.]+$/, "");
		return textureFromCanvas(canvas, name);
	} finally {
		URL.revokeObjectURL(url);
	}
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Could not read that image"));
		img.src = src;
	});
}

import type { IsoSettings, Shape } from "./types";

export function paintScene(
	canvas: HTMLCanvasElement,
	tile: HTMLCanvasElement,
	settings: IsoSettings,
) {
	const n = settings.sceneSize;
	const tw = tile.width;
	const diamond = tw / 2;
	const padX = tw;
	const padY = Math.max(40, tile.height * 0.2);
	const width = (n + n) * (tw / 2) + padX;
	const height = (n + n) * (diamond / 2) + (tile.height - diamond) + padY * 2;
	const maxDim = 4096;
	const scale = Math.min(1, maxDim / Math.max(width, height, 1));
	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));
	const ctx = canvas.getContext("2d")!;
	ctx.imageSmoothingEnabled = settings.filter !== "pixel";
	ctx.imageSmoothingQuality = "high";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(scale, scale);

	const originX = padX / 2 + (n - 1) * (tw / 2);
	const originY = padY;

	for (let d = 0; d < n + n; d++) {
		for (let x = 0; x < n; x++) {
			const y = d - x;
			if (y < 0 || y >= n) continue;
			if (!placeInPreview(settings.shape, x, y)) continue;
			const sx = originX + (x - y) * (tw / 2);
			const sy = originY + (x + y) * (diamond / 2);
			ctx.drawImage(tile, sx, sy);
		}
	}
}

function placeInPreview(shape: Shape, x: number, y: number): boolean {
	if (shape === "wall-left") return x === 0;
	if (shape === "wall-right") return y === 0;
	if (shape === "wall-corner") return x === 0 || y === 0;
	return true;
}

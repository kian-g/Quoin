export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = src.width;
	canvas.height = src.height;
	canvas.getContext("2d")!.drawImage(src, 0, 0);
	return canvas;
}

export function packAtlas(
	tiles: HTMLCanvasElement[],
	columns = 0,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	if (!tiles.length) return canvas;
	const cellW = Math.max(...tiles.map((t) => t.width));
	const cellH = Math.max(...tiles.map((t) => t.height));
	const cols = Math.max(1, columns || Math.min(tiles.length, 5));
	const rows = Math.ceil(tiles.length / cols);
	canvas.width = cols * cellW;
	canvas.height = rows * cellH;
	const ctx = canvas.getContext("2d")!;
	tiles.forEach((tile, i) => {
		ctx.drawImage(tile, (i % cols) * cellW, Math.floor(i / cols) * cellH);
	});
	return canvas;
}

export function downloadPng(canvas: HTMLCanvasElement, name: string) {
	const a = document.createElement("a");
	a.href = canvas.toDataURL("image/png");
	a.download = name;
	a.click();
}

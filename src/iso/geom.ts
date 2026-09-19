import type { IsoSettings } from "./types";

export function cubeHeightFor(tileWidth: number): number {
	return tileWidth / 2;
}

export function tileSize(settings: IsoSettings): {
	width: number;
	height: number;
} {
	const width = settings.tileWidth;
	const diamond = width / 2;
	return { width, height: diamond + cubeHeightFor(width) };
}

function groundDiamond(settings: IsoSettings): [number, number][] {
	const W = settings.tileWidth;
	const H = W / 2;
	const V = cubeHeightFor(W);
	return [
		[W / 2, V],
		[W, V + H / 2],
		[W / 2, V + H],
		[0, V + H / 2],
	];
}

export function strokeFootprint(
	ctx: CanvasRenderingContext2D,
	settings: IsoSettings,
	size: number,
) {
	const diamond = groundDiamond(settings);
	ctx.beginPath();
	ctx.moveTo(diamond[0][0], diamond[0][1]);
	for (let i = 1; i < diamond.length; i++)
		ctx.lineTo(diamond[i][0], diamond[i][1]);
	ctx.closePath();
	ctx.setLineDash([6, 4]);
	ctx.strokeStyle = "rgba(255,255,255,0.95)";
	ctx.lineWidth = Math.max(1.5, size / 160);
	ctx.stroke();
	ctx.strokeStyle = "rgba(0,0,0,0.55)";
	ctx.lineWidth = Math.max(1, size / 220);
	ctx.stroke();
	ctx.setLineDash([]);
}

import { cubeHeightFor, tileSize } from "./geom";
import { blend, clamp, rotateUV, sample } from "./sample";
import { shade } from "./shade";
import {
	SHAPE_OPTIONS,
	type FaceId,
	type FaceTextures,
	type IsoSettings,
	type PbrMaps,
	type Shape,
} from "./types";

type Quad = {
	face: FaceId;
	px: number;
	py: number;
	ux: number;
	uy: number;
	vx: number;
	vy: number;
	light: number;
	tex?: ImageData;
};

function fillQuad(
	dest: Uint8ClampedArray,
	width: number,
	height: number,
	quad: Quad,
	settings: IsoSettings,
	maps: PbrMaps,
) {
	if (!quad.tex) return;
	const tex = quad.tex;
	const { px, py, ux, uy, vx, vy } = quad;
	const det = ux * vy - vx * uy;
	if (Math.abs(det) < 1e-8) return;
	const invDet = 1 / det;
	const xs = [px, px + ux, px + vx, px + ux + vx];
	const ys = [py, py + uy, py + vy, py + uy + vy];
	const minX = Math.max(0, Math.floor(Math.min(...xs)));
	const maxX = Math.min(width - 1, Math.ceil(Math.max(...xs)));
	const minY = Math.max(0, Math.floor(Math.min(...ys)));
	const maxY = Math.min(height - 1, Math.ceil(Math.max(...ys)));
	const aa = settings.filter === "smooth";
	const offsets = aa
		? [
				[0.25, 0.25],
				[0.75, 0.25],
				[0.25, 0.75],
				[0.75, 0.75],
			]
		: [[0.5, 0.5]];
	const weight = 1 / offsets.length;

	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			let cover = 0;
			let ss = 0;
			let tt = 0;
			for (const [ox, oy] of offsets) {
				const dx = x + ox - px;
				const dy = y + oy - py;
				const s = (dx * vy - vx * dy) * invDet;
				const t = (ux * dy - dx * uy) * invDet;
				if (
					s >= -1e-4 &&
					s <= 1 + 1e-4 &&
					t >= -1e-4 &&
					t <= 1 + 1e-4
				) {
					cover += weight;
					ss += s * weight;
					tt += t * weight;
				}
			}
			if (cover <= 0) continue;
			ss /= cover;
			tt /= cover;

			let [u, v] = rotateUV(ss, tt, settings.rotation);
			u = u * settings.repeat + settings.offsetX;
			v = v * settings.repeat + settings.offsetY;
			if (settings.wrap) {
				u -= Math.floor(u);
				v -= Math.floor(v);
			} else {
				u = clamp(u, 0, 1);
				v = clamp(v, 0, 1);
			}

			const albedo = sample(tex, u, v, settings.filter, settings.wrap);
			if (albedo[3] <= 0) continue;
			const [sr, sg, sb, sa] = shade(
				albedo,
				u,
				v,
				quad.face,
				ss,
				tt,
				quad.light,
				settings,
				maps,
			);
			blend(dest, (y * width + x) * 4, sr, sg, sb, sa * cover);
		}
	}
}

export function bakeTile(
	settings: IsoSettings,
	faces: FaceTextures,
	maps: PbrMaps = {},
): HTMLCanvasElement {
	const { width, height } = tileSize(settings);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;
	const image = ctx.createImageData(width, height);
	const W = width;
	const H = W / 2;
	const V = cubeHeightFor(W);
	const drawLeft =
		settings.shape === "cube" ||
		settings.shape === "wall-left" ||
		settings.shape === "wall-corner";
	const drawRight =
		settings.shape === "cube" ||
		settings.shape === "wall-right" ||
		settings.shape === "wall-corner";
	const drawTop = settings.shape === "floor" || settings.shape === "cube";
	const ground = settings.shape === "floor" ? V : 0;

	const top: Quad = {
		face: "top",
		px: W / 2,
		py: ground,
		ux: W / 2,
		uy: H / 2,
		vx: -W / 2,
		vy: H / 2,
		light: settings.lightTop,
		tex: faces.top,
	};

	if (drawLeft && V > 0 && faces.left) {
		const wall = settings.shape !== "cube";
		fillQuad(
			image.data,
			width,
			height,
			{
				face: "left",
				px: 0,
				py: H / 2,
				ux: W / 2,
				uy: wall ? -H / 2 : H / 2,
				vx: 0,
				vy: V,
				light: settings.lightLeft,
				tex: faces.left,
			},
			settings,
			maps,
		);
	}
	if (drawRight && V > 0 && faces.right) {
		const wall = settings.shape !== "cube";
		fillQuad(
			image.data,
			width,
			height,
			{
				face: "right",
				px: W / 2,
				py: wall ? 0 : H,
				ux: W / 2,
				uy: wall ? H / 2 : -H / 2,
				vx: 0,
				vy: V,
				light: settings.lightRight,
				tex: faces.right,
			},
			settings,
			maps,
		);
	}
	if (drawTop && faces.top)
		fillQuad(image.data, width, height, top, settings, maps);
	ctx.putImageData(image, 0, 0);
	return canvas;
}

export function bakeShapes(
	settings: IsoSettings,
	faces: FaceTextures,
	maps: PbrMaps = {},
): Record<Shape, HTMLCanvasElement> {
	const out = {} as Record<Shape, HTMLCanvasElement>;
	for (const { id } of SHAPE_OPTIONS) {
		out[id] = bakeTile({ ...settings, shape: id }, faces, maps);
	}
	return out;
}

import type { IsoSettings, Rotation } from "./types";

export function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

function wrapCoord(x: number, size: number): number {
	return ((x % size) + size) % size;
}

export function rotateUV(
	u: number,
	v: number,
	rot: Rotation,
): [number, number] {
	switch (rot) {
		case 90:
			return [v, 1 - u];
		case 180:
			return [1 - u, 1 - v];
		case 270:
			return [1 - v, u];
		default:
			return [u, v];
	}
}

export function sample(
	tex: ImageData,
	u: number,
	v: number,
	filter: IsoSettings["filter"],
	wrap: boolean,
): [number, number, number, number] {
	const w = tex.width;
	const h = tex.height;
	const data = tex.data;

	if (filter === "pixel") {
		const sx = wrap
			? wrapCoord(Math.floor(u * w), w)
			: clamp(Math.floor(u * w), 0, w - 1);
		const sy = wrap
			? wrapCoord(Math.floor(v * h), h)
			: clamp(Math.floor(v * h), 0, h - 1);
		const i = (sy * w + sx) * 4;
		return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	}

	const x = u * w - 0.5;
	const y = v * h - 0.5;
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;

	const at = (ix: number, iy: number): [number, number, number, number] => {
		const px = wrap ? wrapCoord(ix, w) : clamp(ix, 0, w - 1);
		const py = wrap ? wrapCoord(iy, h) : clamp(iy, 0, h - 1);
		const i = (py * w + px) * 4;
		return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	};

	const c00 = at(x0, y0);
	const c10 = at(x0 + 1, y0);
	const c01 = at(x0, y0 + 1);
	const c11 = at(x0 + 1, y0 + 1);
	const mix = (a: number, b: number, t: number) => a + (b - a) * t;
	return [
		mix(mix(c00[0], c10[0], fx), mix(c01[0], c11[0], fx), fy),
		mix(mix(c00[1], c10[1], fx), mix(c01[1], c11[1], fx), fy),
		mix(mix(c00[2], c10[2], fx), mix(c01[2], c11[2], fx), fy),
		mix(mix(c00[3], c10[3], fx), mix(c01[3], c11[3], fx), fy),
	];
}

export function blend(
	dest: Uint8ClampedArray,
	i: number,
	r: number,
	g: number,
	b: number,
	a: number,
) {
	if (a <= 0) return;
	const sa = a / 255;
	const da = dest[i + 3] / 255;
	const outA = sa + da * (1 - sa);
	if (outA <= 1e-6) {
		dest[i] = dest[i + 1] = dest[i + 2] = dest[i + 3] = 0;
		return;
	}
	dest[i] = (r * sa + dest[i] * da * (1 - sa)) / outA;
	dest[i + 1] = (g * sa + dest[i + 1] * da * (1 - sa)) / outA;
	dest[i + 2] = (b * sa + dest[i + 2] * da * (1 - sa)) / outA;
	dest[i + 3] = outA * 255;
}

import type { FaceId, IsoSettings, PbrMaps } from "./types";
import { clamp, sample } from "./sample";

type Vec3 = [number, number, number];

const BASIS: Record<FaceId, { T: Vec3; B: Vec3; N: Vec3 }> = {
	top: { T: [1, 0, 0], B: [0, 0, 1], N: [0, 1, 0] },
	left: { T: [1, 0, 0], B: [0, -1, 0], N: [0, 0, 1] },
	right: { T: [0, 0, -1], B: [0, -1, 0], N: [1, 0, 0] },
};

const VIEW: Vec3 = [0.48, 0.73, 0.48];

function normalize(v: Vec3): Vec3 {
	const len = Math.hypot(v[0], v[1], v[2]) || 1;
	return [v[0] / len, v[1] / len, v[2] / len];
}

function gray(pixel: [number, number, number, number]): number {
	return (pixel[0] + pixel[1] + pixel[2]) / (3 * 255);
}

function aoFactor(face: FaceId, s: number, t: number, ao: number): number {
	if (ao <= 0) return 1;
	const band = 0.22;
	const fade = (dist: number) => {
		if (dist >= band) return 1;
		const x = dist / band;
		return 1 - ao * (1 - x) * (1 - x);
	};
	if (face === "top") return fade(1 - s) * fade(1 - t);
	if (face === "left") return fade(t) * fade(1 - s);
	return fade(t) * fade(s);
}

export function shade(
	albedo: [number, number, number, number],
	u: number,
	v: number,
	face: FaceId,
	s: number,
	t: number,
	light: number,
	settings: IsoSettings,
	maps: PbrMaps,
): [number, number, number, number] {
	const [sr, sg, sb, sa] = albedo;
	const edge = aoFactor(face, s, t, settings.ao);
	const usePbr = Boolean(
		maps.normal || maps.roughness || maps.metallic || maps.ao,
	);
	if (!usePbr) {
		return [sr * light * edge, sg * light * edge, sb * light * edge, sa];
	}

	const basis = BASIS[face];
	let nx = 0;
	let ny = 0;
	let nz = 1;
	if (maps.normal) {
		const n = sample(maps.normal, u, v, settings.filter, settings.wrap);
		nx = (n[0] / 255) * 2 - 1;
		ny = (n[1] / 255) * 2 - 1;
		nz = (n[2] / 255) * 2 - 1;
		if (settings.flipNormalY) ny = -ny;
		const len2 = nx * nx + ny * ny;
		if (nz < 0.05) nz = Math.sqrt(Math.max(0, 1 - len2));
	}
	let N: Vec3 = [
		basis.T[0] * nx + basis.B[0] * ny + basis.N[0] * nz,
		basis.T[1] * nx + basis.B[1] * ny + basis.N[1] * nz,
		basis.T[2] * nx + basis.B[2] * ny + basis.N[2] * nz,
	];
	N = normalize(N);
	if (N[0] * basis.N[0] + N[1] * basis.N[1] + N[2] * basis.N[2] < 0) {
		N = [-N[0], -N[1], -N[2]];
	}

	const Lraw: Vec3 = [
		settings.lightRight,
		settings.lightTop,
		settings.lightLeft,
	];
	const ndotl = Math.max(0, N[0] * Lraw[0] + N[1] * Lraw[1] + N[2] * Lraw[2]);
	const aoMap = maps.ao
		? gray(sample(maps.ao, u, v, settings.filter, settings.wrap))
		: 1;
	const rough = maps.roughness
		? clamp(
				gray(
					sample(
						maps.roughness,
						u,
						v,
						settings.filter,
						settings.wrap,
					),
				),
				0.04,
				1,
			)
		: 0.82;
	const metal = maps.metallic
		? clamp(
				gray(
					sample(maps.metallic, u, v, settings.filter, settings.wrap),
				),
				0,
				1,
			)
		: 0;

	const L = normalize(Lraw);
	const H = normalize([L[0] + VIEW[0], L[1] + VIEW[1], L[2] + VIEW[2]]);
	const ndoth = Math.max(0, N[0] * H[0] + N[1] * H[1] + N[2] * H[2]);
	const specPow = 2 ** ((1 - rough) * 11);
	const spec = ndotl * ndoth ** specPow * (1 - rough * 0.8);
	const ambient = 0.14;
	const kd = (1 - metal) * (ambient + ndotl * (1 - ambient)) * aoMap * edge;
	const f0 = 0.04 * (1 - metal);
	return [
		sr * kd + (f0 * 255 + sr * metal) * spec,
		sg * kd + (f0 * 255 + sg * metal) * spec,
		sb * kd + (f0 * 255 + sb * metal) * spec,
		sa,
	];
}

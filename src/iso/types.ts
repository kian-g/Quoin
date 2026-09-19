export type Shape =
	| "floor"
	| "cube"
	| "wall-left"
	| "wall-right"
	| "wall-corner";
export type FilterMode = "pixel" | "smooth";
export type Rotation = 0 | 90 | 180 | 270;
export type FaceId = "top" | "left" | "right";

export type IsoSettings = {
	shape: Shape;
	tileWidth: number;
	filter: FilterMode;
	wrap: boolean;
	lightTop: number;
	lightLeft: number;
	lightRight: number;
	ao: number;
	repeat: number;
	offsetX: number;
	offsetY: number;
	rotation: Rotation;
	sceneSize: number;
	flipNormalY: boolean;
};

export type TextureSource = {
	name: string;
	canvas: HTMLCanvasElement;
	data: ImageData;
};

export type MapId = "albedo" | "normal" | "roughness" | "metallic" | "ao";

export type PbrMaps = {
	normal?: ImageData;
	roughness?: ImageData;
	metallic?: ImageData;
	ao?: ImageData;
};

export type PbrState = {
	normal: TextureSource | null;
	roughness: TextureSource | null;
	metallic: TextureSource | null;
	ao: TextureSource | null;
};

export type FaceTextures = {
	top?: ImageData;
	left?: ImageData;
	right?: ImageData;
};

export type SetTile = {
	id: string;
	name: string;
	shape: Shape;
	canvas: HTMLCanvasElement;
	thumb: string;
};

export const TILE_PRESETS = [64, 128, 256, 512] as const;

export const SHAPE_OPTIONS: { id: Shape; label: string }[] = [
	{ id: "floor", label: "Floor" },
	{ id: "cube", label: "Cube" },
	{ id: "wall-left", label: "Wall L" },
	{ id: "wall-right", label: "Wall R" },
	{ id: "wall-corner", label: "Corner" },
];

export function shapeLabel(shape: Shape): string {
	return SHAPE_OPTIONS.find((s) => s.id === shape)?.label ?? shape;
}

export const DEFAULT_SETTINGS: IsoSettings = {
	shape: "cube",
	tileWidth: 128,
	filter: "smooth",
	wrap: true,
	lightTop: 1,
	lightLeft: 0.74,
	lightRight: 0.46,
	ao: 0,
	repeat: 1,
	offsetX: 0,
	offsetY: 0,
	rotation: 0,
	sceneSize: 6,
	flipNormalY: false,
};

export const MAP_SLOTS: { id: MapId; label: string; hint: string }[] = [
	{ id: "albedo", label: "Base color", hint: "albedo / diffuse" },
	{ id: "normal", label: "Normal", hint: "tangent-space" },
	{ id: "roughness", label: "Roughness", hint: "grayscale" },
	{ id: "metallic", label: "Metallic", hint: "grayscale" },
	{ id: "ao", label: "AO", hint: "ambient occlusion" },
];

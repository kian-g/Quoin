import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cloneCanvas, downloadPng, packAtlas } from "./iso/atlas";
import { bakeShapes, bakeTile } from "./iso/bake";
import { strokeFootprint, tileSize } from "./iso/geom";
import { paintScene } from "./iso/scene";
import { shouldFlipNormalY, shortName, textureFromFile } from "./iso/texture";
import {
	DEFAULT_SETTINGS,
	SHAPE_OPTIONS,
	shapeLabel,
	type IsoSettings,
	type MapId,
	type PbrState,
	type SetTile,
	type Shape,
	type TextureSource,
} from "./iso/types";
import { Rail } from "./Rail";
import { Stage } from "./Stage";

export default function App() {
	const [settings, setSettings] = useState<IsoSettings>(DEFAULT_SETTINGS);
	const [albedo, setAlbedo] = useState<TextureSource | null>(null);
	const [pbr, setPbr] = useState<PbrState>({
		normal: null,
		roughness: null,
		metallic: null,
		ao: null,
	});
	const [setTiles, setSetTiles] = useState<SetTile[]>([]);
	const [dragging, setDragging] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const tileRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<HTMLCanvasElement>(null);
	const bakedRef = useRef<HTMLCanvasElement | null>(null);

	const patch = useCallback((partial: Partial<IsoSettings>) => {
		setSettings((s) => ({ ...s, ...partial }));
	}, []);

	const applyMap = useCallback(
		(kind: MapId, tex: TextureSource, filename: string) => {
			setError(null);
			if (kind === "albedo") {
				setAlbedo(tex);
				return;
			}
			setPbr((prev) => ({ ...prev, [kind]: tex }));
			if (kind === "normal" && shouldFlipNormalY(filename)) {
				patch({ flipNormalY: true });
			}
		},
		[patch],
	);

	const ingest = useCallback(
		async (fileList: FileList | File[] | null, slot: MapId = "albedo") => {
			const files = [...(fileList ?? [])].filter((file) =>
				file.type.startsWith("image/"),
			);
			if (!files.length) {
				setError("Drop a PNG, JPEG, or WebP texture.");
				return;
			}
			if (files.length > 1) {
				setError("Upload one image per slot.");
				return;
			}
			const file = files[0];
			try {
				applyMap(slot, await textureFromFile(file), file.name);
			} catch {
				setError("Could not read that image.");
			}
		},
		[applyMap],
	);

	useEffect(() => {
		const onPaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			const files: File[] = [];
			for (const item of items) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) files.push(file);
				}
			}
			if (!files.length) return;
			e.preventDefault();
			void ingest(files);
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, [ingest]);

	const bakedFaces = useMemo(
		() => ({
			top: albedo?.data,
			left: albedo?.data,
			right: albedo?.data,
		}),
		[albedo],
	);
	const pbrMaps = useMemo(
		() => ({
			normal: pbr.normal?.data,
			roughness: pbr.roughness?.data,
			metallic: pbr.metallic?.data,
			ao: pbr.ao?.data,
		}),
		[pbr],
	);
	const hasTexture = Boolean(albedo);
	const hasPreview = hasTexture || setTiles.length > 0;
	const size = tileSize(settings);
	const label = shapeLabel(settings.shape);

	useLayoutEffect(() => {
		const view = tileRef.current;
		const scene = sceneRef.current;
		const tile = hasTexture
			? bakeTile(settings, bakedFaces, pbrMaps)
			: (setTiles.findLast((t) => t.shape === settings.shape)?.canvas ??
				null);
		bakedRef.current = hasTexture ? tile : null;

		if (view) {
			if (!tile) {
				view.width = 1;
				view.height = 1;
			} else {
				view.width = tile.width;
				view.height = tile.height;
				const ctx = view.getContext("2d")!;
				ctx.imageSmoothingEnabled = settings.filter !== "pixel";
				ctx.clearRect(0, 0, view.width, view.height);
				ctx.drawImage(tile, 0, 0);
				strokeFootprint(ctx, settings, tile.width);
			}
		}

		if (scene) {
			if (tile) paintScene(scene, tile, settings);
			else {
				scene.width = 1;
				scene.height = 1;
			}
		}
	}, [settings, bakedFaces, hasTexture, pbrMaps, setTiles]);

	const mapTex = (id: MapId): TextureSource | null =>
		id === "albedo" ? albedo : pbr[id];

	const addShapes = (shapes: Shape[]) => {
		if (!hasTexture) return;
		const baked = bakeShapes(settings, bakedFaces, pbrMaps);
		const stamp = Date.now();
		const base = shortName(albedo?.name ?? "tile");
		setSetTiles((prev) => [
			...prev,
			...shapes.map((shape, i) => {
				const canvas = cloneCanvas(baked[shape]);
				return {
					id: `${stamp}-${i}-${shape}`,
					name: `${base} ${shapeLabel(shape)}`,
					shape,
					canvas,
					thumb: canvas.toDataURL("image/png"),
				};
			}),
		]);
	};

	const download = () => {
		const tile = bakedRef.current;
		if (!tile) return;
		downloadPng(
			tile,
			`quoin-${settings.shape}-${size.width}x${size.height}.png`,
		);
	};

	const downloadAll = () => {
		if (!hasTexture) return;
		const baked = bakeShapes(settings, bakedFaces, pbrMaps);
		downloadPng(
			packAtlas(
				SHAPE_OPTIONS.map((s) => baked[s.id]),
				5,
			),
			`quoin-all-${size.width}x${size.height}.png`,
		);
	};

	const downloadAtlas = () => {
		if (!setTiles.length) return;
		const cell = setTiles[0].canvas;
		downloadPng(
			packAtlas(
				setTiles.map((t) => t.canvas),
				5,
			),
			`quoin-atlas-${cell.width}x${cell.height}.png`,
		);
	};

	const copy = async () => {
		const tile = bakedRef.current;
		if (!tile) return;
		try {
			const blob = await new Promise<Blob | null>((resolve) =>
				tile.toBlob(resolve, "image/png"),
			);
			if (!blob) return;
			await navigator.clipboard.write([
				new ClipboardItem({ "image/png": blob }),
			]);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		} catch {
			setError("Clipboard is blocked — use Export PNG instead.");
		}
	};

	return (
		<div
			className={`app${dragging ? " is-drop" : ""}`}
			onDragEnter={(e) => {
				e.preventDefault();
				setDragging(true);
			}}
			onDragOver={(e) => e.preventDefault()}
			onDragLeave={(e) => {
				if (e.currentTarget === e.target) setDragging(false);
			}}
			onDrop={(e) => {
				e.preventDefault();
				setDragging(false);
				void ingest(e.dataTransfer.files);
			}}
		>
			<Rail
				settings={settings}
				pbr={pbr}
				setTiles={setTiles}
				error={error}
				hasTexture={hasTexture}
				label={label}
				mapTex={mapTex}
				onPatch={patch}
				onIngest={(files, fallback) => void ingest(files, fallback)}
				onClearSlot={(id) => {
					if (id === "albedo") setAlbedo(null);
					else setPbr((prev) => ({ ...prev, [id]: null }));
				}}
				onAddShapes={addShapes}
				onRemoveTile={(id) =>
					setSetTiles((prev) => prev.filter((t) => t.id !== id))
				}
				onExportAtlas={downloadAtlas}
			/>
			<Stage
				hasPreview={hasPreview}
				hasTexture={hasTexture}
				settings={settings}
				label={label}
				size={size}
				copied={copied}
				tileRef={tileRef}
				sceneRef={sceneRef}
				onDownload={download}
				onDownloadAll={downloadAll}
				onCopy={() => void copy()}
				onSceneSize={(sceneSize) => patch({ sceneSize })}
			/>
		</div>
	);
}

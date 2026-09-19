import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type RefObject,
} from "react";
import type { IsoSettings } from "./iso/types";

export function Stage({
	hasPreview,
	hasTexture,
	settings,
	label,
	size,
	copied,
	tileRef,
	sceneRef,
	onDownload,
	onDownloadAll,
	onCopy,
	onSceneSize,
}: {
	hasPreview: boolean;
	hasTexture: boolean;
	settings: IsoSettings;
	label: string;
	size: { width: number; height: number };
	copied: boolean;
	tileRef: RefObject<HTMLCanvasElement | null>;
	sceneRef: RefObject<HTMLCanvasElement | null>;
	onDownload: () => void;
	onDownloadAll: () => void;
	onCopy: () => void;
	onSceneSize: (n: number) => void;
}) {
	const [cam, setCam] = useState({ x: 0, y: 0, z: 1 });
	const [panning, setPanning] = useState(false);
	const stageRef = useRef<HTMLDivElement>(null);
	const camRef = useRef(cam);

	useEffect(() => {
		camRef.current = cam;
	}, [cam]);

	const resetCam = useCallback(() => setCam({ x: 0, y: 0, z: 1 }), []);

	const zoomBy = useCallback(
		(factor: number, origin?: { x: number; y: number }) => {
			const el = stageRef.current;
			const prev = camRef.current;
			const z = Math.max(0.25, Math.min(8, prev.z * factor));
			if (!el || !origin) {
				setCam({ ...prev, z });
				return;
			}
			const rect = el.getBoundingClientRect();
			const mx = origin.x - rect.left;
			const my = origin.y - rect.top;
			const cx = rect.width / 2;
			const cy = rect.height / 2;
			const wx = (mx - cx - prev.x) / prev.z;
			const wy = (my - cy - prev.y) / prev.z;
			setCam({
				x: mx - cx - wx * z,
				y: my - cy - wy * z,
				z,
			});
		},
		[],
	);

	useEffect(() => {
		const el = stageRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			zoomBy(e.deltaY > 0 ? 0.9 : 1.1, { x: e.clientX, y: e.clientY });
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [zoomBy, hasPreview]);

	return (
		<main className="stage">
			{hasPreview ? (
				<div
					ref={stageRef}
					className={`diorama${panning ? " is-panning" : ""}`}
					onPointerDown={(e) => {
						if (e.button !== 0) return;
						if ((e.target as HTMLElement).closest("button")) return;
						e.currentTarget.setPointerCapture(e.pointerId);
						setPanning(true);
						const start = {
							x: e.clientX,
							y: e.clientY,
							cx: cam.x,
							cy: cam.y,
						};
						const onMove = (ev: PointerEvent) => {
							setCam((c) => ({
								...c,
								x: start.cx + (ev.clientX - start.x),
								y: start.cy + (ev.clientY - start.y),
							}));
						};
						const onUp = () => {
							setPanning(false);
							window.removeEventListener("pointermove", onMove);
							window.removeEventListener("pointerup", onUp);
						};
						window.addEventListener("pointermove", onMove);
						window.addEventListener("pointerup", onUp);
					}}
					onDoubleClick={resetCam}
				>
					<div
						className="scene-wrap"
						style={{
							transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`,
						}}
					>
						<canvas
							ref={sceneRef}
							className={`scene${settings.filter === "pixel" ? " is-pixel" : ""}`}
						/>
					</div>
					<div className="zoom-bar">
						<button type="button" onClick={() => zoomBy(1.15)}>
							+
						</button>
						<button type="button" onClick={() => zoomBy(1 / 1.15)}>
							−
						</button>
						<button type="button" onClick={resetCam}>
							Reset
						</button>
					</div>
				</div>
			) : (
				<div className="empty">Upload a texture to preview</div>
			)}
			<div className="dock">
				<div className="specimen">
					<div
						className={`tile-frame${settings.filter === "pixel" ? " is-pixel" : ""}`}
					>
						<canvas ref={tileRef} hidden={!hasPreview} />
					</div>
					<div className="meta">
						<strong>{label}</strong>
						<span>
							{size.width}×{size.height} PNG
						</span>
					</div>
				</div>
				<div className="actions">
					<button
						type="button"
						className="primary"
						onClick={onDownload}
						disabled={!hasTexture}
					>
						Export PNG
					</button>
					<button
						type="button"
						onClick={onDownloadAll}
						disabled={!hasTexture}
					>
						Export all
					</button>
					<button
						type="button"
						onClick={onCopy}
						disabled={!hasTexture}
					>
						{copied ? "Copied" : "Copy"}
					</button>
					<label className="scene-size">
						Scene {settings.sceneSize}×{settings.sceneSize}
						<input
							type="range"
							min={3}
							max={9}
							value={settings.sceneSize}
							onChange={(e) =>
								onSceneSize(Number(e.target.value))
							}
						/>
					</label>
				</div>
			</div>
		</main>
	);
}

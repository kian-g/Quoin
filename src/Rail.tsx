import { MapSlot, Slider, Toggle } from "./ui";
import {
	MAP_SLOTS,
	SHAPE_OPTIONS,
	TILE_PRESETS,
	type IsoSettings,
	type MapId,
	type PbrState,
	type SetTile,
	type Shape,
	type TextureSource,
} from "./iso/types";

export function Rail({
	settings,
	pbr,
	setTiles,
	error,
	hasTexture,
	label,
	mapTex,
	onPatch,
	onIngest,
	onClearSlot,
	onAddShapes,
	onRemoveTile,
	onExportAtlas,
}: {
	settings: IsoSettings;
	pbr: PbrState;
	setTiles: SetTile[];
	error: string | null;
	hasTexture: boolean;
	label: string;
	mapTex: (id: MapId) => TextureSource | null;
	onPatch: (partial: Partial<IsoSettings>) => void;
	onIngest: (files: FileList | File[] | null, fallback?: MapId) => void;
	onClearSlot: (id: MapId) => void;
	onAddShapes: (shapes: Shape[]) => void;
	onRemoveTile: (id: string) => void;
	onExportAtlas: () => void;
}) {
	return (
		<aside className="rail">
			<section>
				<h2>Textures</h2>
				<div className="map-list">
					{MAP_SLOTS.map((slot) => (
						<MapSlot
							key={slot.id}
							slot={slot}
							tex={mapTex(slot.id)}
							onFiles={(files) => onIngest(files, slot.id)}
							onClear={() => onClearSlot(slot.id)}
						/>
					))}
				</div>
				{error && <p className="error">{error}</p>}
			</section>

			<section>
				<h2>Mesh</h2>
				<div className="seg wrap">
					{SHAPE_OPTIONS.map((opt) => (
						<button
							key={opt.id}
							type="button"
							className={settings.shape === opt.id ? "is-on" : ""}
							onClick={() => onPatch({ shape: opt.id })}
						>
							{opt.label}
						</button>
					))}
				</div>
				<label className="field">
					Tile {settings.tileWidth}×{settings.tileWidth / 2}
				</label>
				<div className="seg">
					{TILE_PRESETS.map((w) => (
						<button
							key={w}
							type="button"
							className={settings.tileWidth === w ? "is-on" : ""}
							onClick={() => onPatch({ tileWidth: w })}
						>
							{w}
						</button>
					))}
				</div>
			</section>

			<section>
				<h2>Set</h2>
				<div className="set-actions">
					<button
						type="button"
						disabled={!hasTexture}
						onClick={() => onAddShapes([settings.shape])}
					>
						Add {label}
					</button>
					<button
						type="button"
						disabled={!hasTexture}
						onClick={() =>
							onAddShapes(SHAPE_OPTIONS.map((s) => s.id))
						}
					>
						Add all shapes
					</button>
				</div>
				{setTiles.length ? (
					<>
						<div className="set-grid">
							{setTiles.map((item) => (
								<div key={item.id} className="set-item">
									<img src={item.thumb} alt="" />
									<span title={item.name}>{item.name}</span>
									<button
										type="button"
										className="set-remove"
										aria-label="Remove"
										onClick={() => onRemoveTile(item.id)}
									>
										×
									</button>
								</div>
							))}
						</div>
						<button
							type="button"
							className="text-btn"
							onClick={onExportAtlas}
						>
							Export atlas
						</button>
					</>
				) : (
					<p className="set-empty">
						Add tiles from different textures, then export one
						spritesheet.
					</p>
				)}
			</section>

			<section>
				<h2>Look</h2>
				<Slider
					label="Top light"
					value={settings.lightTop}
					min={0.2}
					max={1.2}
					step={0.01}
					onChange={(lightTop) => onPatch({ lightTop })}
				/>
				<Slider
					label="Left face"
					value={settings.lightLeft}
					min={0.15}
					max={1.1}
					step={0.01}
					onChange={(lightLeft) => onPatch({ lightLeft })}
				/>
				<Slider
					label="Right face"
					value={settings.lightRight}
					min={0.15}
					max={1.1}
					step={0.01}
					onChange={(lightRight) => onPatch({ lightRight })}
				/>
				<Slider
					label="Occlusion"
					value={settings.ao}
					min={0}
					max={0.85}
					step={0.01}
					onChange={(ao) => onPatch({ ao })}
				/>
				<div className="toggles">
					<Toggle
						label="Pixel art"
						on={settings.filter === "pixel"}
						onChange={(on) =>
							onPatch({ filter: on ? "pixel" : "smooth" })
						}
					/>
					<Toggle
						label="Repeat"
						on={settings.wrap}
						onChange={(wrap) => onPatch({ wrap })}
					/>
					{pbr.normal && (
						<Toggle
							label="Flip normal Y"
							on={settings.flipNormalY}
							onChange={(flipNormalY) => onPatch({ flipNormalY })}
						/>
					)}
				</div>
			</section>

			<section>
				<h2>Mapping</h2>
				<Slider
					label="Repeat"
					value={settings.repeat}
					min={0.25}
					max={4}
					step={0.05}
					onChange={(repeat) => onPatch({ repeat })}
				/>
				<Slider
					label="Offset X"
					value={settings.offsetX}
					min={0}
					max={1}
					step={0.01}
					onChange={(offsetX) => onPatch({ offsetX })}
				/>
				<Slider
					label="Offset Y"
					value={settings.offsetY}
					min={0}
					max={1}
					step={0.01}
					onChange={(offsetY) => onPatch({ offsetY })}
				/>
				<label className="field">Rotate</label>
				<div className="seg">
					{([0, 90, 180, 270] as const).map((r) => (
						<button
							key={r}
							type="button"
							className={settings.rotation === r ? "is-on" : ""}
							onClick={() => onPatch({ rotation: r })}
						>
							{r}°
						</button>
					))}
				</div>
			</section>
		</aside>
	);
}

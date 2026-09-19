import { useMemo, useRef } from "react";
import { shortName } from "./iso/texture";
import type { MapId, TextureSource } from "./iso/types";

export function MapSlot({
	slot,
	tex,
	onFiles,
	onClear,
}: {
	slot: { id: MapId; label: string; hint: string };
	tex: TextureSource | null;
	onFiles: (files: FileList | File[] | null) => void;
	onClear: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const src = useMemo(() => tex?.canvas.toDataURL() ?? null, [tex]);
	const filename = tex ? shortName(tex.name) : slot.hint;
	return (
		<div className="map-row">
			<button
				type="button"
				className="drop"
				onClick={() => inputRef.current?.click()}
			>
				{tex && src ? <img src={src} alt="" /> : null}
				<span>
					<strong>{slot.label}</strong>
					<em title={tex ? filename : undefined}>{filename}</em>
				</span>
			</button>
			{tex && (
				<button
					type="button"
					className="clear"
					aria-label="Clear"
					onClick={(e) => {
						e.stopPropagation();
						onClear();
					}}
				>
					×
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				hidden
				onChange={(e) => {
					onFiles(e.target.files);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

export function Slider({
	label,
	value,
	min,
	max,
	step = 1,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (v: number) => void;
}) {
	return (
		<label className="slider">
			<span>
				{label}
				<strong>{format(value, step)}</strong>
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</label>
	);
}

function format(value: number, step: number): string {
	if (step >= 1) return String(Math.round(value));
	return value.toFixed(step < 0.05 ? 2 : 1);
}

export function Toggle({
	label,
	on,
	onChange,
}: {
	label: string;
	on: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			className={`toggle${on ? " is-on" : ""}`}
			onClick={() => onChange(!on)}
		>
			{label}
		</button>
	);
}

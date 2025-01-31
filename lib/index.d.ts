import { vec2, vec3 } from '@basementuniverse/vec';
import React, { CSSProperties } from 'react';
declare const JULIA_PRESETS: {
    [key: string]: {
        a: number;
        b: number;
    };
};
type FractalProps = Partial<{
    className: string;
    style: CSSProperties;
    backgroundColour: vec3;
    foregroundColours: vec3[];
    scale: number;
    offset: vec2;
    julia: boolean;
    juliaPreset: keyof typeof JULIA_PRESETS | null;
    a: number;
    b: number;
}>;
export declare function Fractal({ className, style, backgroundColour, foregroundColours, scale, offset, julia, juliaPreset, a, b, }: FractalProps): React.JSX.Element;
export {};

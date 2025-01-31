"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fractal = Fractal;
const vec_1 = require("@basementuniverse/vec");
const utils_1 = require("@basementuniverse/utils");
const react_1 = __importStar(require("react"));
const react_resize_detector_1 = require("react-resize-detector");
const MAX = 100;
const BOUNDS = 16;
const JULIA_PRESETS = {
    a: { a: -0.4, b: 0.6 },
    b: { a: 0.285, b: 0 },
    c: { a: 0.285, b: 0.1 },
    d: { a: 0.45, b: 0.1428 },
    e: { a: -0.70176, b: -0.3842 },
    f: { a: -0.835, b: -0.2321 },
    g: { a: -0.8, b: 0.156 },
    h: { a: -0.7269, b: 0.1889 },
    i: { a: 0, b: -0.8 },
};
const DEFAULT_COLOURS = [
    (0, vec_1.vec3)(0, 0, 0),
    (0, vec_1.vec3)(1, 0, 0),
    (0, vec_1.vec3)(1, 1, 0),
    (0, vec_1.vec3)(0, 1, 0),
    (0, vec_1.vec3)(0, 1, 1),
    (0, vec_1.vec3)(0, 0, 1),
    (0, vec_1.vec3)(1, 0, 1),
    (0, vec_1.vec3)(1, 1, 1)
];
const Canvas = react_1.default.forwardRef((props, ref) => react_1.default.createElement("canvas", Object.assign({ ref: ref }, props)));
function draw(context, backgroundColour = (0, vec_1.vec3)(), foregroundColours = DEFAULT_COLOURS, scale = 1, offset = (0, vec_1.vec2)(), julia = false, a = 1, b = 1) {
    if (context === null) {
        return;
    }
    const size = {
        x: context.canvas.width,
        y: context.canvas.height
    };
    context.fillStyle = colourToString(backgroundColour);
    context.fillRect(0, 0, size.x, size.y);
    const imageData = context.createImageData(size.x, size.y);
    for (let x = 0; x < size.x; x++) {
        for (let y = 0; y < size.y; y++) {
            const transformedPosition = vec_1.vec2.mul(vec_1.vec2.add((0, vec_1.vec2)((0, utils_1.remap)(x, 0, size.x, -0.5, 0.5), (0, utils_1.remap)(y, 0, size.y, -0.5, 0.5)), (0, vec_1.vec2)(offset.x, offset.y)), scale);
            const c = julia ? (0, vec_1.vec2)(a, b) : transformedPosition;
            let z = (0, vec_1.vec2)(transformedPosition);
            let n = 0;
            while (n++ < MAX) {
                z = vec_1.vec2.add((0, vec_1.vec2)(z.x * z.x - z.y * z.y, 2 * z.x * z.y), c);
                if (Math.abs(z.x) > BOUNDS || Math.abs(z.y) > BOUNDS) {
                    break;
                }
            }
            const colour = interpolateColour(foregroundColours, (0, utils_1.remap)(n, 0, MAX, 0, 1));
            setPixel(imageData, (0, vec_1.vec2)(x, y), colour, size.x);
        }
    }
    context.putImageData(imageData, 0, 0);
}
function interpolateColour(colours, i) {
    return vec_1.vec3.map((0, vec_1.vec3)(), (v, component) => (0, utils_1.lerpArray)(colours.map(c => c[component]), i));
}
function colourToString(colour) {
    const [r, g, b] = vec_1.vec3.swiz(colour, 'rgb').map(c => Math.round(c * 255));
    return `rgb(${r}, ${g}, ${b})`;
}
function imageDataIndex(position, width) {
    return position.y * (width * 4) + (position.x * 4);
}
function setPixel(imageData, position, colour, width) {
    const i = imageDataIndex(position, width);
    const [r, g, b] = vec_1.vec3.swiz(colour, 'rgb');
    imageData.data[i + 0] = Math.round(r * 255);
    imageData.data[i + 1] = Math.round(g * 255);
    imageData.data[i + 2] = Math.round(b * 255);
    imageData.data[i + 3] = 255;
}
function Fractal({ className = '', style = {}, backgroundColour = (0, vec_1.vec3)(0, 0, 0), foregroundColours = DEFAULT_COLOURS, scale = 4, offset = (0, vec_1.vec2)(-0.15, 0.001), julia = false, juliaPreset = 'a', a = 1, b = 1, }) {
    const canvasRef = (0, react_1.useRef)(null);
    let context = null;
    (0, react_1.useEffect)(() => {
        if (canvasRef.current !== null) {
            context = canvasRef.current.getContext('2d');
        }
    }, []);
    const handleDraw = (0, react_1.useCallback)(() => {
        if (canvasRef.current !== null) {
            context = canvasRef.current.getContext('2d');
            draw(context, backgroundColour, foregroundColours, scale, offset, julia, (julia && juliaPreset) ? JULIA_PRESETS[juliaPreset].a : a, (julia && juliaPreset) ? JULIA_PRESETS[juliaPreset].b : b);
        }
    }, [
        backgroundColour,
        foregroundColours,
        scale,
        offset,
        julia,
        juliaPreset,
        a,
        b,
    ]);
    (0, react_1.useEffect)(() => {
        handleDraw();
    }, [handleDraw]);
    const onResize = (0, react_1.useCallback)((width, height) => {
        if (width &&
            height &&
            canvasRef.current !== null) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            handleDraw();
        }
    }, []);
    const { width, height, ref: resizeRef } = (0, react_resize_detector_1.useResizeDetector)({
        handleHeight: true,
        refreshMode: 'debounce',
        refreshRate: 500,
        refreshOptions: { trailing: true },
        onResize: () => setTimeout(() => onResize(width, height), 500),
    });
    return (react_1.default.createElement("div", { ref: resizeRef, className: `freactal ${className}`, style: style },
        react_1.default.createElement(Canvas, { ref: canvasRef, style: { width: '100%', height: '100%' } })));
}

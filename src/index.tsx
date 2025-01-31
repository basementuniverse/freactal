import { vec2, vec3 } from '@basementuniverse/vec';
import { lerpArray, remap } from '@basementuniverse/utils';
import React, {
  useRef,
  useEffect,
  useCallback,
  Ref,
  CSSProperties,
} from 'react';
import { useResizeDetector } from 'react-resize-detector';

const MAX = 100; // Maximum number of iterations
const BOUNDS = 16; // Bounding value (if abs(z) > BOUNDS, stop iterating)

const JULIA_PRESETS: {
  [key: string]: {
    a: number; // Real part
    b: number; // Imaginary part
  };
} = {
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

const DEFAULT_COLOURS: vec3[] = [
  vec3(0, 0, 0),
  vec3(1, 0, 0),
  vec3(1, 1, 0),
  vec3(0, 1, 0),
  vec3(0, 1, 1),
  vec3(0, 0, 1),
  vec3(1, 0, 1),
  vec3(1, 1, 1)
];

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

const Canvas = React.forwardRef(
  (
    props: Record<string, any>,
    ref: Ref<HTMLCanvasElement>
  ) => <canvas ref={ref} {...props} />
);

/**
 * Render a fractal on a canvas
 */
function draw(
  context: CanvasRenderingContext2D | null,
  backgroundColour: vec3 = vec3(),
  foregroundColours: vec3[] = DEFAULT_COLOURS,
  scale: number = 1,
  offset: vec2 = vec2(),
  julia: boolean = false,
  a: number = 1,
  b: number = 1
) {
  if (context === null) {
    return;
  }

  const size = {
    x: context.canvas.width,
    y: context.canvas.height
  };

  // Draw background
  context.fillStyle = colourToString(backgroundColour);
  context.fillRect(0, 0, size.x, size.y);

  const imageData = context.createImageData(size.x, size.y);
  for (let x = 0; x < size.x; x++) {
    for (let y = 0; y < size.y; y++) {
      // Translate and scale position
      const transformedPosition = vec2.mul(vec2.add(
        vec2(
          remap(x, 0, size.x, -0.5, 0.5),
          remap(y, 0, size.y, -0.5, 0.5)
        ),
        vec2(offset.x, offset.y)
      ), scale);

      // Constant c
      // If showing Julia Set, set c to a complex constant, otherwise set this
      // to the current position
      const c = julia ? vec2(a, b) : transformedPosition;

      // Iterated value z
      let z = vec2(transformedPosition);

      // Counter n
      let n = 0;
      while (n++ < MAX) {
        /*

        https://en.wikipedia.org/wiki/Mandelbrot_set

        Znew = Zold^2 + c
        c is a complex number (a+bi), represented on the canvas plane
        fractal shows set of c for which f(z) is bounded when iterated from 0

        note:
        (a+bi)^2 = a^2 + 2abi - b^2 => (a^2 - b^2, 2ab)

        */
        z = vec2.add(vec2(z.x * z.x - z.y * z.y, 2 * z.x * z.y), c);
        if (Math.abs(z.x) > BOUNDS || Math.abs(z.y) > BOUNDS) {
          break;
        }
      }

      // Resulting grayscale value
      const colour = interpolateColour(
        foregroundColours,
        remap(n, 0, MAX, 0, 1)
      );
      setPixel(imageData, vec2(x, y), colour, size.x);
    }
  }

  context.putImageData(imageData, 0, 0);
}

/**
 * Given an array of colours and a real-valued index, interpolate between the
 * colours to get the blended colour at that index
 *
 * Because whoever said array indexes must be integers lacked imagination...
 */
function interpolateColour(colours: vec3[], i: number): vec3 {
  return vec3.map(
    vec3(),
    (v: number, component: 'x' | 'y' | 'z') => lerpArray(
      colours.map(c => c[component]),
      i
    )
  );
}

/**
 * Convert a colour vector into a CSS colour string
 */
function colourToString(colour: vec3): string {
  const [r, g, b] = vec3.swiz(colour, 'rgb').map(c => Math.round(c * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert a 2d position into an index in the image data array
 */
function imageDataIndex(position: vec2, width: number): number {
  return position.y * (width * 4) + (position.x * 4);
}

/**
 * Set a pixel in the image data array
 */
function setPixel(
  imageData: ImageData,
  position: vec2,
  colour: vec3,
  width: number
): void {
  const i = imageDataIndex(position, width);
  const [r, g, b] = vec3.swiz(colour, 'rgb');
  imageData.data[i + 0] = Math.round(r * 255);
  imageData.data[i + 1] = Math.round(g * 255);
  imageData.data[i + 2] = Math.round(b * 255);
  imageData.data[i + 3] = 255;
}

/**
 * React fractal component, because dashboards need more fractals
 */
export function Fractal({
  className = '',
  style = {},
  backgroundColour = vec3(0, 0, 0),
  foregroundColours = DEFAULT_COLOURS,
  scale = 4,
  offset = vec2(-0.15, 0.001),
  julia = false,
  juliaPreset = 'a',
  a = 1,
  b = 1,
}: FractalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let context: CanvasRenderingContext2D | null = null;

  // Initialise rendering context on mount
  useEffect(() => {
    if (canvasRef.current !== null) {
      context = canvasRef.current.getContext('2d');
    }
  }, []);

  // Handle redraw
  const handleDraw = useCallback(
    () => {
      if (canvasRef.current !== null) {
        context = canvasRef.current.getContext('2d');
        draw(
          context,
          backgroundColour,
          foregroundColours,
          scale,
          offset,
          julia,
          (julia && juliaPreset) ? JULIA_PRESETS[juliaPreset].a : a,
          (julia && juliaPreset) ? JULIA_PRESETS[juliaPreset].b : b
        );
      }
    },
    [
      backgroundColour,
      foregroundColours,
      scale,
      offset,
      julia,
      juliaPreset,
      a,
      b,
    ]
  );

  // Redraw on prop change
  useEffect(() => {
    handleDraw();
  }, [handleDraw]);

  // Handle resize
  const onResize = useCallback((width?: number, height?: number) => {
    if (
      width &&
      height &&
      canvasRef.current !== null
    ) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      handleDraw();
    }
  }, []);
  const { width, height, ref: resizeRef } = useResizeDetector({
    handleHeight: true,
    refreshMode: 'debounce',
    refreshRate: 500,
    refreshOptions: { trailing: true },
    onResize: () => setTimeout(() => onResize(width, height), 500),
  });

  return (
    <div
      ref={resizeRef}
      className={`freactal ${className}`}
      style={style}
    >
      <Canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

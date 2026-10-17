import '@testing-library/jest-dom';

// Mock HTMLCanvasElement.getContext and getBoundingClientRect for jsdom
if (typeof window !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (this: any, contextId: string) {
    if (contextId === '2d') {
      if (this._ctx) {
        return this._ctx;
      }

      const canvas = this;
      let fillStyle: any = '#000000';
      let strokeStyle: any = '#000000';

      const ctx: any = {
        canvas,
        get fillStyle() {
          return fillStyle;
        },
        set fillStyle(val: any) {
          fillStyle = val;
        },
        get strokeStyle() {
          return strokeStyle;
        },
        set strokeStyle(val: any) {
          strokeStyle = val;
        },
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',

        fillRect: (x: number, y: number, w: number, h: number) => {
          const color = typeof fillStyle === 'string' ? fillStyle : fillStyle?._color?.() || '#0000ff';
          if (!canvas._drawings) canvas._drawings = [];
          canvas._drawings.push({ type: 'rect', x, y, w, h, color });
          canvas._lastFill = color;
          canvas._fillBounds = { x, y, w, h };
        },

        strokeRect: (x: number, y: number, w: number, h: number) => {
          const color = typeof strokeStyle === 'string' ? strokeStyle : strokeStyle?._color?.() || '#000000';
          if (!canvas._drawings) canvas._drawings = [];
          canvas._drawings.push({ type: 'strokeRect', x, y, w, h, color });
        },

        clearRect: (x: number, y: number, w: number, h: number) => {
          if (x <= 0 && y <= 0 && w >= (canvas.width || 0) && h >= (canvas.height || 0)) {
            canvas._drawings = [];
            canvas._fillBounds = null;
          }
        },

        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: (x: number, y: number, r: number) => {
          canvas._lastArc = { x, y, r };
        },
        ellipse: (x: number, y: number, rx: number, ry: number) => {
          canvas._lastArc = { x, y, r: Math.max(rx, ry) };
        },
        fill: () => {
          const color = typeof fillStyle === 'string' ? fillStyle : fillStyle?._color?.() || '#ff0000';
          canvas._lastFill = color;
          if (canvas._lastArc) {
            const { x, y, r } = canvas._lastArc;
            const bounds = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
            canvas._fillBounds = bounds;
            if (!canvas._drawings) canvas._drawings = [];
            canvas._drawings.push({ type: 'arc', ...bounds, color });
          }
        },
        stroke: () => {
          const color = typeof strokeStyle === 'string' ? strokeStyle : strokeStyle?._color?.() || '#000000';
          canvas._lastStroke = color;
        },

        createRadialGradient: () => {
          let stop0Color = '#ff0000';
          return {
            addColorStop: (offset: number, color: string) => {
              if (offset === 0) stop0Color = color;
            },
            _color: () => stop0Color,
          };
        },
        createLinearGradient: () => {
          let stop0Color = '#000000';
          return {
            addColorStop: (offset: number, color: string) => {
              if (offset === 0) stop0Color = color;
            },
            _color: () => stop0Color,
          };
        },

        drawImage: (source: any, dx: number = 0, dy: number = 0) => {
          if (source && source._drawings) {
            if (!canvas._drawings) canvas._drawings = [];
            for (const item of source._drawings) {
              const shifted = { ...item, x: item.x + dx, y: item.y + dy };
              canvas._drawings.push(shifted);
            }
          }
          if (source && source._fillBounds) {
            canvas._fillBounds = {
              x: source._fillBounds.x + dx,
              y: source._fillBounds.y + dy,
              w: source._fillBounds.w,
              h: source._fillBounds.h,
            };
            canvas._lastFill = source._lastFill;
          }
        },

        getImageData: (x: number, y: number, w: number, h: number) => {
          const arr = new Uint8ClampedArray(w * h * 4);
          const hexToRgb = (hex: string) => {
            if (!hex || !hex.startsWith('#')) return [0, 0, 0];
            const clean = hex.slice(1);
            if (clean.length === 3) {
              return [
                parseInt(clean[0] + clean[0], 16) || 0,
                parseInt(clean[1] + clean[1], 16) || 0,
                parseInt(clean[2] + clean[2], 16) || 0,
              ];
            }
            return [
              parseInt(clean.slice(0, 2), 16) || 0,
              parseInt(clean.slice(2, 4), 16) || 0,
              parseInt(clean.slice(4, 6), 16) || 0,
            ];
          };

          let hitColor: string | null = null;
          if (canvas._drawings) {
            for (let i = canvas._drawings.length - 1; i >= 0; i--) {
              const d = canvas._drawings[i];
              if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) {
                hitColor = d.color;
                break;
              }
            }
          }

          if (!hitColor && canvas._fillBounds) {
            const b = canvas._fillBounds;
            if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
              hitColor = canvas._lastFill || '#0000ff';
            }
          }

          if (hitColor) {
            const [r, g, b] = hexToRgb(hitColor);
            for (let i = 0; i < arr.length; i += 4) {
              arr[i] = r;
              arr[i + 1] = g;
              arr[i + 2] = b;
              arr[i + 3] = 255;
            }
          }

          return {
            data: arr,
            width: w,
            height: h,
          };
        },

        putImageData: () => {},
        createImageData: (w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
        }),

        fillText: () => {},
        measureText: (text: string) => ({ width: text.length * 8 }),
        save: () => {},
        restore: () => {},
        scale: () => {},
        rotate: () => {},
        translate: () => {},
        setTransform: () => {},
        transform: () => {},
        rect: () => {},
        clip: () => {},
      };

      Object.defineProperty(this, '_ctx', {
        value: ctx,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      return ctx;
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };

  HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback, type = 'image/png') {
    const blob = new Blob(['mock-png-data'], { type });
    setTimeout(() => callback(blob), 0);
  };
}

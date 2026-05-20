export const APP_VERSION = "1.0.0";

export const CELL = 32;
export const PIECE_PAD = 1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const SVG_NS = "http://www.w3.org/2000/svg";

/** Canvas background — must match --bg in styles.css (female connector fill). */
export const BACKGROUND_COLOR = "#f4efe6";

/**
 * Each variant.connectors is read clockwise from the top-left corner:
 * top (left→right), right (top→bottom), bottom (right→left), left (bottom→top).
 * 1 = male (outward tab), 0 = female (inward notch).
 */
/** Toolbar / keyboard cycling order for piece types. */
export const PIECE_TYPE_ORDER = ["2x2", "2x1", "1x2", "1x1"];

export const PIECE_TYPES = {
  "2x2": {
    w: 2,
    h: 2,
    color: "#e85d5d",
    variants: [
      { name: "0", connectors: [0, 0, 0, 0, 0, 0, 0, 0] },
      { name: "A", connectors: [1, 1, 0, 0, 1, 1, 0, 0] },
      { name: "B", connectors: [0, 0, 1, 1, 0, 0, 1, 1] },
      { name: "C", connectors: [1, 1, 0, 1, 0, 0, 1, 0] },
      { name: "D", connectors: [1, 0, 1, 1, 0, 1, 0, 0] },
      { name: "E", connectors: [0, 0, 1, 0, 1, 1, 0, 1] },
      { name: "F", connectors: [0, 1, 0, 0, 1, 0, 1, 1] },
    ],
  },
  "2x1": {
    w: 2,
    h: 1,
    color: "#4a8fd4",
    variants: [
      { name: "0", connectors: [0, 0, 0, 0, 0, 0] },
      { name: "A", connectors: [1, 0, 1, 0, 1, 0] },
      { name: "B", connectors: [0, 1, 0, 1, 0, 1] },
    ],
  },
  "1x2": {
    w: 1,
    h: 2,
    color: "#5cb87a",
    variants: [
      { name: "0", connectors: [0, 0, 0, 0, 0, 0] },
      { name: "A", connectors: [1, 0, 1, 0, 1, 0] },
      { name: "B", connectors: [0, 1, 0, 1, 0, 1] },
    ],
  },
  "1x1": {
    w: 1,
    h: 1,
    color: "#e8a43a",
    variants: [
      { name: "0", connectors: [0, 0, 0, 0] },
      { name: "A", connectors: [1, 0, 1, 0] },
      { name: "B", connectors: [0, 1, 0, 1] },
    ],
  },
};

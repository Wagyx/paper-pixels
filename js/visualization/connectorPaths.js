import { CELL } from "../config.js";

/** Male tab radius (fraction of cell size). */
export const MALE_CONNECTOR_RADIUS_RATIO = 0.24;
/** Female notch is wider than male so paired connectors leave a small gap. */
export const FEMALE_CONNECTOR_RADIUS_RATIO = 0.3;

export function maleConnectorRadius(cell = CELL) {
  return cell * MALE_CONNECTOR_RADIUS_RATIO;
}

export function femaleConnectorRadius(cell = CELL) {
  return cell * FEMALE_CONNECTOR_RADIUS_RATIO;
}

/** @returns {string} SVG path d for a semicircle tab on the given edge. */
export function tabPath(cx, cy, side, outward, radius) {
  const r = radius;
  switch (side) {
    case "top":
      return outward
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
        : `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
    case "right":
      return outward
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`
        : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
    case "bottom":
      return outward
        ? `M ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy}`
        : `M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`;
    case "left":
      return outward
        ? `M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`
        : `M ${cx} ${cy + r} A ${r} ${r} 0 0 0 ${cx} ${cy - r}`;
    default:
      return "";
  }
}

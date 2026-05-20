import { BACKGROUND_COLOR, CELL, SVG_NS } from "../config.js";
import { getConnectorSlots, getSlotCenter } from "../model/connectors.js";
import { scaledPad } from "./pieceGeometry.js";

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

/** Fills the inset gap between the piece body and a male tab on the footprint edge. */
function maleBridgeAttrs(cx, cy, side, cell, radius) {
  const pad = scaledPad(cell);
  switch (side) {
    case "top":
      return { x: cx - radius, y: cy, width: radius * 2, height: pad };
    case "bottom":
      return { x: cx - radius, y: cy - pad, width: radius * 2, height: pad };
    case "right":
      return { x: cx - pad, y: cy - radius, width: pad, height: radius * 2 };
    case "left":
      return { x: cx, y: cy - radius, width: pad, height: radius * 2 };
    default:
      return { x: cx, y: cy, width: pad, height: pad };
  }
}

function createMaleBridge(cx, cy, side, pieceColor, cell, radius, pieceId) {
  const attrs = maleBridgeAttrs(cx, cy, side, cell, radius);
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("class", "connector connector-male-bridge");
  rect.setAttribute("x", attrs.x);
  rect.setAttribute("y", attrs.y);
  rect.setAttribute("width", attrs.width);
  rect.setAttribute("height", attrs.height);
  rect.setAttribute("fill", pieceColor);
  if (pieceId != null) {
    rect.dataset.pieceId = String(pieceId);
  }
  return rect;
}

/**
 * @returns {{ female: SVGPathElement[], male: SVGPathElement[] }}
 */
export function createConnectorElements(piece, pieceColor, cell = CELL) {
  const slots = getConnectorSlots(piece);
  const female = [];
  const male = [];

  const maleR = maleConnectorRadius(cell);
  const femaleR = femaleConnectorRadius(cell);

  for (const slot of slots) {
    if (slot.kind !== 0 && slot.kind !== 1) continue;
    const { cx, cy } = getSlotCenter(piece, piece.type, slot, cell);
    const isMale = slot.kind === 1;

    if (isMale) {
      male.push(
        createMaleBridge(cx, cy, slot.side, pieceColor, cell, maleR, piece.id)
      );
    }

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      tabPath(cx, cy, slot.side, isMale, isMale ? maleR : femaleR)
    );
    path.setAttribute(
      "class",
      isMale ? "connector connector-male" : "connector connector-female"
    );
    path.setAttribute("fill", isMale ? pieceColor : BACKGROUND_COLOR);
    if (piece.id != null) {
      path.dataset.pieceId = String(piece.id);
    }
    (isMale ? male : female).push(path);
  }

  return { female, male };
}

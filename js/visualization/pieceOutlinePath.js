import { PIECE_TYPES } from "../config.js";
import { getConnectorSlots, getSlotCenter } from "../model/connectors.js";
import {
  femaleConnectorRadius,
  maleConnectorRadius,
  tabPath,
} from "./connectorPaths.js";
import { scaledPad } from "./pieceGeometry.js";

function arcOnly(tabD) {
  const i = tabD.indexOf("A");
  return i >= 0 ? tabD.slice(i) : tabD;
}

function appendTab(parts, cx, cy, side, outward, radius) {
  parts.push(arcOnly(tabPath(cx, cy, side, outward, radius)));
}

/**
 * Closed SVG path for a piece silhouette (body inset + connector tabs/notches).
 * @param {object} piece
 * @param {number} [cell]
 * @param {{ includeConnectors?: boolean }} [options]
 * @returns {string}
 */
export function pieceOutlinePath(piece, cell, options = {}) {
  const { includeConnectors = true } = options;
  const def = PIECE_TYPES[piece.type];
  const pad = scaledPad(cell);
  const x = piece.gx * cell + pad;
  const y = piece.gy * cell + pad;
  const x1 = x + def.w * cell - pad * 2;
  const y1 = y + def.h * cell - pad * 2;

  if (!includeConnectors) {
    return `M ${x} ${y} L ${x1} ${y} L ${x1} ${y1} L ${x} ${y1} Z`;
  }

  const maleR = maleConnectorRadius(cell);
  const femaleR = femaleConnectorRadius(cell);
  const slots = getConnectorSlots(piece);
  const bySide = { top: [], right: [], bottom: [], left: [] };
  for (const slot of slots) {
    bySide[slot.side].push(slot);
  }

  const parts = [`M ${x} ${y}`];
  let px = x;
  let py = y;

  const lineTo = (nx, ny) => {
    parts.push(`L ${nx} ${ny}`);
    px = nx;
    py = ny;
  };

  const detour = (slot) => {
    const isMale = slot.kind === 1;
    const r = isMale ? maleR : femaleR;
    const { cx, cy } = getSlotCenter(piece, piece.type, slot, cell);
    const outward = isMale;

    switch (slot.side) {
      case "top":
        lineTo(cx - r, py);
        lineTo(cx - r, cy);
        appendTab(parts, cx, cy, "top", outward, r);
        lineTo(cx + r, py);
        break;
      case "right":
        lineTo(px, cy - r);
        lineTo(cx, cy - r);
        appendTab(parts, cx, cy, "right", outward, r);
        lineTo(px, cy + r);
        break;
      case "bottom":
        lineTo(cx + r, py);
        lineTo(cx + r, cy);
        appendTab(parts, cx, cy, "bottom", outward, r);
        lineTo(cx - r, py);
        break;
      case "left":
        lineTo(px, cy + r);
        lineTo(cx, cy + r);
        appendTab(parts, cx, cy, "left", outward, r);
        lineTo(px, cy - r);
        break;
      default:
        break;
    }
  };

  for (const slot of bySide.top) {
    if (slot.kind === 0 || slot.kind === 1) detour(slot);
  }
  lineTo(x1, y);

  for (const slot of bySide.right) {
    if (slot.kind === 0 || slot.kind === 1) detour(slot);
  }
  lineTo(x1, y1);

  for (const slot of bySide.bottom) {
    if (slot.kind === 0 || slot.kind === 1) detour(slot);
  }
  lineTo(x, y1);

  for (const slot of bySide.left) {
    if (slot.kind === 0 || slot.kind === 1) detour(slot);
  }

  parts.push("Z");
  return parts.join(" ");
}

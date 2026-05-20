import { CELL, PIECE_TYPES } from "../config.js";

/** Number of connector slots on the outer perimeter (clockwise from top-left). */
export function connectorSlotCount(type) {
  const { w, h } = PIECE_TYPES[type];
  return 2 * w + 2 * h;
}

export function getVariant(type, variantIndex = 0) {
  const def = PIECE_TYPES[type];
  const variants = def.variants;
  if (!variants?.length) {
    throw new Error(`Piece type "${type}" has no variants.`);
  }
  const index =
    ((variantIndex % variants.length) + variants.length) % variants.length;
  return { variant: variants[index], index };
}

export function getVariantConnectors(type, variantIndex = 0) {
  return getVariant(type, variantIndex).variant.connectors;
}

/**
 * Expands a connector bitmask into edge slots in walk order:
 * top (left→right), right (top→bottom), bottom (right→left), left (bottom→top).
 */
export function getConnectorSlots(piece) {
  const def = PIECE_TYPES[piece.type];
  const { w, h } = def;
  const variantIndex = piece.variantIndex ?? 0;
  const connectors = getVariantConnectors(piece.type, variantIndex);
  const expected = connectorSlotCount(piece.type);

  if (connectors.length !== expected) {
    throw new Error(
      `Piece "${piece.type}" variant ${variantIndex} needs ${expected} connector values, got ${connectors.length}.`
    );
  }

  const slots = [];
  let i = 0;

  for (let c = 0; c < w; c++) {
    slots.push({ side: "top", cellIndex: c, kind: connectors[i++] });
  }
  for (let r = 0; r < h; r++) {
    slots.push({ side: "right", cellIndex: r, kind: connectors[i++] });
  }
  for (let c = w - 1; c >= 0; c--) {
    slots.push({ side: "bottom", cellIndex: c, kind: connectors[i++] });
  }
  for (let r = h - 1; r >= 0; r--) {
    slots.push({ side: "left", cellIndex: r, kind: connectors[i++] });
  }

  return slots;
}

/**
 * Connector anchor on the cell-grid footprint so paired tabs align on shared edges.
 */
export function getSlotCenter(piece, type, slot, cell = CELL) {
  const { w, h } = PIECE_TYPES[type];
  const { gx, gy } = piece;

  switch (slot.side) {
    case "top":
      return {
        cx: (gx + slot.cellIndex + 0.5) * cell,
        cy: gy * cell,
      };
    case "right":
      return {
        cx: (gx + w) * cell,
        cy: (gy + slot.cellIndex + 0.5) * cell,
      };
    case "bottom":
      return {
        cx: (gx + slot.cellIndex + 0.5) * cell,
        cy: (gy + h) * cell,
      };
    case "left":
      return {
        cx: gx * cell,
        cy: (gy + slot.cellIndex + 0.5) * cell,
      };
    default:
      return { cx: gx * cell, cy: gy * cell };
  }
}

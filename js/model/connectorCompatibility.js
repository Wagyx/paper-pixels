import { PIECE_TYPES } from "../config.js";
import { getConnectorSlots } from "./connectors.js";

function pieceCells(piece) {
  const { w, h } = PIECE_TYPES[piece.type];
  const cells = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      cells.push({ gx: piece.gx + dx, gy: piece.gy + dy });
    }
  }
  return cells;
}

export function getConnectorKind(piece, side, cellIndex) {
  const slots = getConnectorSlots(piece);
  const slot = slots.find(
    (s) => s.side === side && s.cellIndex === cellIndex
  );
  return slot?.kind ?? null;
}

/** Two facing connectors are invalid when both are male (1). */
export function areFacingConnectorsCompatible(kindA, kindB) {
  return !(kindA === 1 && kindB === 1);
}

/**
 * @param {object} piece - candidate with type, gx, gy, variantIndex
 * @param {object[]} neighbors - placed pieces to test against (excludes self)
 */
export function validateConnectorAdjacency(piece, neighbors) {
  const { w, h } = PIECE_TYPES[piece.type];
  const { gx, gy } = piece;

  const cellToPiece = new Map();
  for (const p of neighbors) {
    for (const { gx: cx, gy: cy } of pieceCells(p)) {
      cellToPiece.set(`${cx},${cy}`, p);
    }
  }

  function neighborAt(ngx, ngy) {
    return cellToPiece.get(`${ngx},${ngy}`) ?? null;
  }

  function checkPair(kindA, kindB) {
    return areFacingConnectorsCompatible(kindA, kindB);
  }

  for (let c = 0; c < w; c++) {
    const n = neighborAt(gx + c, gy - 1);
    if (n) {
      const ok = checkPair(
        getConnectorKind(piece, "top", c),
        getConnectorKind(n, "bottom", gx + c - n.gx)
      );
      if (!ok) return false;
    }
  }

  for (let r = 0; r < h; r++) {
    const n = neighborAt(gx + w, gy + r);
    if (n) {
      const ok = checkPair(
        getConnectorKind(piece, "right", r),
        getConnectorKind(n, "left", gy + r - n.gy)
      );
      if (!ok) return false;
    }
  }

  for (let c = 0; c < w; c++) {
    const n = neighborAt(gx + c, gy + h);
    if (n) {
      const ok = checkPair(
        getConnectorKind(piece, "bottom", c),
        getConnectorKind(n, "top", gx + c - n.gx)
      );
      if (!ok) return false;
    }
  }

  for (let r = 0; r < h; r++) {
    const n = neighborAt(gx - 1, gy + r);
    if (n) {
      const ok = checkPair(
        getConnectorKind(piece, "left", r),
        getConnectorKind(n, "right", gy + r - n.gy)
      );
      if (!ok) return false;
    }
  }

  return true;
}

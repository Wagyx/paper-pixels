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

/** Manual placement: invalid only when both connectors are male (1). */
export function areFacingConnectorsPlacementValid(kindA, kindB) {
  return !(kindA === 1 && kindB === 1);
}

/** Solver: shared edges must interlock with one male and one female. */
export function areFacingConnectorsConnected(kindA, kindB) {
  return (kindA === 1 && kindB === 0) || (kindA === 0 && kindB === 1);
}

function validateConnectorAdjacencyWith(piece, neighbors, checkPair) {
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

/**
 * @param {object} piece - candidate with type, gx, gy, variantIndex
 * @param {object[]} neighbors - placed pieces to test against (excludes self)
 */
export function validateConnectorAdjacency(piece, neighbors) {
  return validateConnectorAdjacencyWith(
    piece,
    neighbors,
    areFacingConnectorsPlacementValid
  );
}

/**
 * @param {object} piece - candidate with type, gx, gy, variantIndex
 * @param {object[]} neighbors - placed pieces to test against (excludes self)
 */
export function validateConnectorAdjacencyConnected(piece, neighbors) {
  return validateConnectorAdjacencyWith(
    piece,
    neighbors,
    areFacingConnectorsConnected
  );
}

/**
 * Counts shared edges (once each) that are not male/female paired.
 * @param {object[]} pieces
 */
export function countUnsatisfiedConnections(pieces) {
  if (pieces.length === 0) return 0;

  const cellToPiece = new Map();
  for (const p of pieces) {
    for (const { gx, gy } of pieceCells(p)) {
      cellToPiece.set(`${gx},${gy}`, p);
    }
  }

  let count = 0;

  for (const piece of pieces) {
    const { w, h } = PIECE_TYPES[piece.type];
    const { gx, gy } = piece;

    function checkSharedEdge(ngx, ngy, side, cellIndex, neighborSide, neighborCell) {
      const neighbor = cellToPiece.get(`${ngx},${ngy}`);
      if (!neighbor || neighbor.id === piece.id) return;
      if (piece.id > neighbor.id) return;

      const kindA = getConnectorKind(piece, side, cellIndex);
      const kindB = getConnectorKind(neighbor, neighborSide, neighborCell);
      if (!areFacingConnectorsConnected(kindA, kindB)) count++;
    }

    for (let c = 0; c < w; c++) {
      const ngy = gy - 1;
      const neighbor = cellToPiece.get(`${gx + c},${ngy}`);
      if (neighbor) {
        checkSharedEdge(gx + c, ngy, "top", c, "bottom", gx + c - neighbor.gx);
      }
    }

    for (let r = 0; r < h; r++) {
      const ngx = gx + w;
      const neighbor = cellToPiece.get(`${ngx},${gy + r}`);
      if (neighbor) {
        checkSharedEdge(ngx, gy + r, "right", r, "left", gy + r - neighbor.gy);
      }
    }

    for (let c = 0; c < w; c++) {
      const ngy = gy + h;
      const neighbor = cellToPiece.get(`${gx + c},${ngy}`);
      if (neighbor) {
        checkSharedEdge(gx + c, ngy, "bottom", c, "top", gx + c - neighbor.gx);
      }
    }

    for (let r = 0; r < h; r++) {
      const ngx = gx - 1;
      const neighbor = cellToPiece.get(`${ngx},${gy + r}`);
      if (neighbor) {
        checkSharedEdge(ngx, gy + r, "left", r, "right", gy + r - neighbor.gy);
      }
    }
  }

  return count;
}

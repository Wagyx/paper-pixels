import { CELL, PIECE_PAD, PIECE_TYPES } from "../config.js";

export function scaledPad(cell) {
  if (cell === CELL) return PIECE_PAD;
  return Math.max(1, Math.round((PIECE_PAD * cell) / CELL));
}

export function pieceRectAttrs(piece, cell = CELL) {
  const def = PIECE_TYPES[piece.type];
  const pad = scaledPad(cell);
  return {
    x: piece.gx * cell + pad,
    y: piece.gy * cell + pad,
    width: def.w * cell - pad * 2,
    height: def.h * cell - pad * 2,
  };
}

export function pieceFootprintAttrs(piece, cell = CELL) {
  const def = PIECE_TYPES[piece.type];
  return {
    x: piece.gx * cell,
    y: piece.gy * cell,
    width: def.w * cell,
    height: def.h * cell,
  };
}

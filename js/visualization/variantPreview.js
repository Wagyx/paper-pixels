import { PIECE_TYPES, SVG_NS } from "../config.js";
import { buildPieceGroup } from "./pieceGraphics.js";

const PREVIEW_CELL = 20;

export function createVariantPreviewSvg(type, variantIndex) {
  const def = PIECE_TYPES[type];
  const piece = {
    type,
    gx: 0,
    gy: 0,
    color: def.color,
    variantIndex,
  };

  const pad = PREVIEW_CELL * 0.6;
  const viewW = def.w * PREVIEW_CELL + pad * 2;
  const viewH = def.h * PREVIEW_CELL + pad * 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "variant-preview-svg");
  svg.setAttribute("viewBox", `${-pad} ${-pad} ${viewW} ${viewH}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("aria-hidden", "true");

  svg.appendChild(
    buildPieceGroup(piece, { cellSize: PREVIEW_CELL, hideRing: true })
  );

  return svg;
}

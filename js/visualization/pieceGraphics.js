import { CELL, SVG_NS } from "../config.js";
import { pieceFootprintAttrs } from "./pieceGeometry.js";
import { pieceOutlinePath } from "./pieceOutlinePath.js";

function createSvg(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function hexWithAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pieceFill(piece, options = {}) {
  const { isPreview = false, previewValid = true } = options;
  if (isPreview && !previewValid) return "rgba(200, 80, 80, 0.35)";
  if (isPreview) return hexWithAlpha(piece.color, 0.55);
  return piece.color;
}

export function createPieceBody(piece, options = {}) {
  const {
    isPreview = false,
    previewValid = true,
    cellSize = CELL,
    dataId = piece.id,
    showConnectors = true,
  } = options;

  const body = createSvg("path", {
    class: "piece-body",
    d: pieceOutlinePath(piece, cellSize, { includeConnectors: showConnectors }),
    fill: pieceFill(piece, { isPreview, previewValid }),
  });

  if (dataId != null) {
    body.dataset.pieceId = String(dataId);
  }

  return body;
}

export function createSelectionRing(piece, options = {}) {
  const { cellSize = CELL, hideRing = false, isPreview = false } = options;
  const footprint = pieceFootprintAttrs(piece, cellSize);

  const ring = createSvg("rect", {
    class: "selection-ring",
    x: footprint.x,
    y: footprint.y,
    width: footprint.width,
    height: footprint.height,
  });

  if (hideRing || isPreview) {
    ring.setAttribute("visibility", "hidden");
  }

  return ring;
}

export function updatePieceBody(body, piece, options = {}) {
  const {
    isPreview = false,
    previewValid = true,
    cellSize = CELL,
    showConnectors = true,
  } = options;

  body.setAttribute(
    "d",
    pieceOutlinePath(piece, cellSize, { includeConnectors: showConnectors })
  );
  body.setAttribute("fill", pieceFill(piece, { isPreview, previewValid }));
}

export function updateSelectionRing(ring, piece, isSelected, cellSize = CELL) {
  const footprint = pieceFootprintAttrs(piece, cellSize);
  ring.setAttribute("x", footprint.x);
  ring.setAttribute("y", footprint.y);
  ring.setAttribute("width", footprint.width);
  ring.setAttribute("height", footprint.height);
  ring.classList.toggle("visible", isSelected);
}

export function buildPieceGroup(piece, options = {}) {
  const {
    isSelected = false,
    isPreview = false,
    previewValid = true,
    cellSize = CELL,
    hideRing = false,
    showConnectors = true,
  } = options;

  const g = createSvg("g", {
    class: isPreview ? "piece piece-preview-group" : "piece",
  });

  const ring = createSelectionRing(piece, { cellSize, hideRing, isPreview });
  const body = createPieceBody(piece, {
    isPreview,
    previewValid,
    cellSize,
    dataId: null,
    showConnectors,
  });

  g.append(body, ring);
  g.classList.toggle("selected", isSelected);
  if (isPreview) g.classList.toggle("invalid", !previewValid);

  return g;
}

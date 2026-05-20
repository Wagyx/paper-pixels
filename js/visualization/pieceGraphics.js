import { CELL, SVG_NS } from "../config.js";
import { createConnectorElements } from "./connectorPaths.js";
import { pieceFootprintAttrs, pieceRectAttrs } from "./pieceGeometry.js";

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

export function createPieceBody(piece, options = {}) {
  const {
    isPreview = false,
    previewValid = true,
    cellSize = CELL,
    dataId = piece.id,
  } = options;

  const bodyAttrs = pieceRectAttrs(piece, cellSize);
  let fill = piece.color;
  if (isPreview && !previewValid) fill = "rgba(200, 80, 80, 0.35)";
  else if (isPreview) fill = hexWithAlpha(piece.color, 0.55);

  const body = createSvg("rect", {
    class: "piece-body",
    x: bodyAttrs.x,
    y: bodyAttrs.y,
    width: bodyAttrs.width,
    height: bodyAttrs.height,
    fill,
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
  const { isPreview = false, previewValid = true, cellSize = CELL } = options;
  const bodyAttrs = pieceRectAttrs(piece, cellSize);
  let fill = piece.color;
  if (isPreview && !previewValid) fill = "rgba(200, 80, 80, 0.35)";
  else if (isPreview) fill = hexWithAlpha(piece.color, 0.55);

  body.setAttribute("x", bodyAttrs.x);
  body.setAttribute("y", bodyAttrs.y);
  body.setAttribute("width", bodyAttrs.width);
  body.setAttribute("height", bodyAttrs.height);
  body.setAttribute("fill", fill);
}

export function updateSelectionRing(ring, piece, isSelected, cellSize = CELL) {
  const footprint = pieceFootprintAttrs(piece, cellSize);
  ring.setAttribute("x", footprint.x);
  ring.setAttribute("y", footprint.y);
  ring.setAttribute("width", footprint.width);
  ring.setAttribute("height", footprint.height);
  ring.classList.toggle("visible", isSelected);
}

/** Preview / toolbar: bodies, then female, then male within one group. */
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
  });

  g.append(body);

  if (showConnectors) {
    const { female, male } = createConnectorElements(
      piece,
      piece.color,
      cellSize
    );
    const femaleLayer = createSvg("g", { class: "piece-connectors-female" });
    const maleLayer = createSvg("g", { class: "piece-connectors-male" });
    female.forEach((node) => femaleLayer.appendChild(node));
    male.forEach((node) => maleLayer.appendChild(node));
    g.append(femaleLayer, maleLayer);
  }

  g.append(ring);
  g.classList.toggle("selected", isSelected);
  if (isPreview) g.classList.toggle("invalid", !previewValid);

  return g;
}

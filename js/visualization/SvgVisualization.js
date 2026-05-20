import { CELL, SVG_NS } from "../config.js";
import {
  buildPieceGroup,
  createPieceBody,
  createSelectionRing,
  updatePieceBody,
  updateSelectionRing,
} from "./pieceGraphics.js";
import { createConnectorElements } from "./connectorPaths.js";

function createSvg(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

export class SvgVisualization {
  constructor(svgElement) {
    this.svg = svgElement;
    this.worldGroup = svgElement.querySelector("#world");
    this.gridLayer = svgElement.querySelector("#gridLayer");
    this.piecesLayer = svgElement.querySelector("#piecesLayer");
    this.previewLayer = svgElement.querySelector("#previewLayer");

    this.bodiesLayer = this.piecesLayer.querySelector("#piecesBodiesLayer");
    this.femaleLayer = this.piecesLayer.querySelector("#piecesFemaleConnectorsLayer");
    this.maleLayer = this.piecesLayer.querySelector("#piecesMaleConnectorsLayer");
    this.ringsLayer = this.piecesLayer.querySelector("#piecesRingsLayer");

    this.pieceParts = new Map();
    this.previewGroup = null;
    this.interactionPlane = null;
    this.showConnectors = true;
    this.showGrid = true;
  }

  getViewportSize() {
    const rect = this.svg.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

  viewportClientCorners() {
    const rect = this.svg.getBoundingClientRect();
    return [
      { x: rect.left, y: rect.top },
      { x: rect.right, y: rect.top },
      { x: rect.left, y: rect.bottom },
      { x: rect.right, y: rect.bottom },
    ];
  }

  applyCamera(camera) {
    const { w, h } = this.getViewportSize();
    this.worldGroup.setAttribute(
      "transform",
      `translate(${w / 2}, ${h / 2}) scale(${camera.zoom}) translate(${-camera.x}, ${-camera.y})`
    );
  }

  clientToWorld(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgCtm = this.svg.getScreenCTM();
    if (!svgCtm) return { x: 0, y: 0 };
    const inSvg = pt.matrixTransform(svgCtm.inverse());
    const worldPt = this.svg.createSVGPoint();
    worldPt.x = inSvg.x;
    worldPt.y = inSvg.y;
    const worldCtm = this.worldGroup.getCTM();
    if (!worldCtm) return { x: 0, y: 0 };
    return worldPt.matrixTransform(worldCtm.inverse());
  }

  worldToGrid(wx, wy) {
    return {
      gx: Math.floor(wx / CELL),
      gy: Math.floor(wy / CELL),
    };
  }

  getPieceIdFromTarget(target) {
    const node = target.closest("[data-piece-id]");
    if (!node) return null;
    return Number(node.dataset.pieceId);
  }

  setCursorMode(mode) {
    this.svg.classList.remove("panning", "dragging-pieces", "zooming");
    if (mode) this.svg.classList.add(mode);
  }

  renderGrid(camera, showGrid = this.showGrid) {
    this.showGrid = showGrid;
    this.applyCamera(camera);
    this.gridLayer.replaceChildren();

    const corners = this.viewportClientCorners().map((c) =>
      this.clientToWorld(c.x, c.y)
    );

    let minWx = Infinity;
    let maxWx = -Infinity;
    let minWy = Infinity;
    let maxWy = -Infinity;
    for (const p of corners) {
      minWx = Math.min(minWx, p.x);
      maxWx = Math.max(maxWx, p.x);
      minWy = Math.min(minWy, p.y);
      maxWy = Math.max(maxWy, p.y);
    }

    if (showGrid) {
      const startGx = Math.floor(minWx / CELL) - 1;
      const endGx = Math.ceil(maxWx / CELL) + 1;
      const startGy = Math.floor(minWy / CELL) - 1;
      const endGy = Math.ceil(maxWy / CELL) + 1;

      const fragment = document.createDocumentFragment();

      for (let gx = startGx; gx <= endGx; gx++) {
        const x = gx * CELL;
        fragment.appendChild(
          createSvg("line", {
            class: "grid-line",
            x1: x,
            y1: minWy - CELL,
            x2: x,
            y2: maxWy + CELL,
          })
        );
      }

      for (let gy = startGy; gy <= endGy; gy++) {
        const y = gy * CELL;
        fragment.appendChild(
          createSvg("line", {
            class: "grid-line",
            x1: minWx - CELL,
            y1: y,
            x2: maxWx + CELL,
            y2: y,
          })
        );
      }

      this.gridLayer.appendChild(fragment);
    }

    const pad = CELL * 2;
    const planeX = minWx - pad;
    const planeY = minWy - pad;
    const planeW = maxWx - minWx + pad * 2;
    const planeH = maxWy - minWy + pad * 2;

    if (!this.interactionPlane) {
      this.interactionPlane = createSvg("rect", {
        class: "interaction-plane",
        fill: "transparent",
      });
    }
    this.interactionPlane.setAttribute("x", planeX);
    this.interactionPlane.setAttribute("y", planeY);
    this.interactionPlane.setAttribute("width", planeW);
    this.interactionPlane.setAttribute("height", planeH);
    this.gridLayer.prepend(this.interactionPlane);
  }

  removePieceConnectors(pieceId) {
    const id = String(pieceId);
    this.femaleLayer
      .querySelectorAll(`[data-piece-id="${id}"]`)
      .forEach((node) => node.remove());
    this.maleLayer
      .querySelectorAll(`[data-piece-id="${id}"]`)
      .forEach((node) => node.remove());
  }

  clearAllConnectors() {
    this.femaleLayer.replaceChildren();
    this.maleLayer.replaceChildren();
  }

  setPieceConnectors(piece) {
    this.removePieceConnectors(piece.id);
    if (!this.showConnectors) return;
    const { female, male } = createConnectorElements(piece, piece.color);
    female.forEach((node) => this.femaleLayer.appendChild(node));
    male.forEach((node) => this.maleLayer.appendChild(node));
  }

  upsertPiece(piece, isSelected) {
    let parts = this.pieceParts.get(piece.id);

    if (!parts) {
      const body = createPieceBody(piece, { dataId: piece.id });
      const ring = createSelectionRing(piece);
      this.bodiesLayer.appendChild(body);
      this.ringsLayer.appendChild(ring);
      this.setPieceConnectors(piece);
      parts = { body, ring };
      this.pieceParts.set(piece.id, parts);
    } else {
      updatePieceBody(parts.body, piece);
      this.setPieceConnectors(piece);
    }

    parts.body.classList.toggle("selected", isSelected);
    updateSelectionRing(parts.ring, piece, isSelected);
  }

  removePiece(pieceId) {
    const parts = this.pieceParts.get(pieceId);
    if (!parts) return;
    parts.body.remove();
    parts.ring.remove();
    this.removePieceConnectors(pieceId);
    this.pieceParts.delete(pieceId);
  }

  renderPieces(pieces, selectedIds, showConnectors = this.showConnectors) {
    this.showConnectors = showConnectors;

    if (!showConnectors) {
      this.clearAllConnectors();
    }

    const ids = new Set(pieces.map((p) => p.id));

    for (const id of this.pieceParts.keys()) {
      if (!ids.has(id)) this.removePiece(id);
    }

    for (const piece of pieces) {
      this.upsertPiece(piece, selectedIds.has(piece.id));
    }
  }

  renderPreview(placementPreview, isValid, showConnectors = this.showConnectors) {
    this.previewLayer.replaceChildren();

    if (!placementPreview) {
      this.previewGroup = null;
      return;
    }

    this.previewGroup = buildPieceGroup(placementPreview, {
      isPreview: true,
      previewValid: isValid,
      showConnectors,
    });
    this.previewLayer.appendChild(this.previewGroup);
  }

  render(state) {
    this.showConnectors = state.showConnectors;
    this.showGrid = state.showGrid;
    this.renderGrid(state.camera, state.showGrid);
    this.renderPieces(state.pieces, state.selectedIds, state.showConnectors);
    this.renderPreview(
      state.placementPreview,
      state.placementPreviewValid,
      state.showConnectors
    );
  }

  updatePiecesOnly(pieces, selectedIds, showConnectors = this.showConnectors) {
    this.renderPieces(pieces, selectedIds, showConnectors);
  }
}

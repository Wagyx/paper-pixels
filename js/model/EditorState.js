import { CELL, MAX_ZOOM, MIN_ZOOM, PIECE_TYPES } from "../config.js";
import { validateConnectorAdjacency } from "./connectorCompatibility.js";

export class EditorState {
  constructor() {
    this.pieces = [];
    this.nextId = 1;
    this.activeType = "2x2";
    this.activeVariantByType = Object.fromEntries(
      Object.keys(PIECE_TYPES).map((type) => [type, 0])
    );
    this.selectedIds = new Set();
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.placementPreview = null;
    this.showConnectors = true;
    this.showGrid = true;
  }

  getActiveVariantIndex(type = this.activeType) {
    return this.activeVariantByType[type] ?? 0;
  }

  setActiveVariant(type, variantIndex) {
    const def = PIECE_TYPES[type];
    const max = def.variants.length - 1;
    this.activeVariantByType[type] = Math.max(0, Math.min(variantIndex, max));
  }

  cycleActiveVariant(direction) {
    const def = PIECE_TYPES[this.activeType];
    const count = def.variants.length;
    if (count <= 1) return false;
    const current = this.getActiveVariantIndex();
    const next = (current + direction + count) % count;
    this.setActiveVariant(this.activeType, next);
    return true;
  }

  exportLayout() {
    return {
      version: 1,
      pieces: this.pieces.map(({ type, variantIndex, gx, gy, color }) => ({
        type,
        variantIndex,
        gx,
        gy,
        color,
      })),
    };
  }

  importLayout(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.pieces)) {
      return false;
    }

    const imported = [];
    for (const raw of data.pieces) {
      const def = PIECE_TYPES[raw?.type];
      if (!def) return false;
      const variantIndex = Number(raw.variantIndex);
      if (
        !Number.isInteger(variantIndex) ||
        variantIndex < 0 ||
        variantIndex >= def.variants.length
      ) {
        return false;
      }
      const gx = Number(raw.gx);
      const gy = Number(raw.gy);
      if (!Number.isInteger(gx) || !Number.isInteger(gy)) return false;

      imported.push({
        id: imported.length + 1,
        type: raw.type,
        variantIndex,
        gx,
        gy,
        color:
          typeof raw.color === "string" && raw.color
            ? raw.color
            : def.color,
      });
    }

    this.pieces = imported;
    this.nextId = imported.length + 1;
    this.clearSelection();
    return true;
  }

  findPiece(id) {
    return this.pieces.find((p) => p.id === id) ?? null;
  }

  findPieceAtCell(gx, gy) {
    for (const piece of this.pieces) {
      for (const cell of this.getPieceCells(piece)) {
        if (cell.gx === gx && cell.gy === gy) return piece;
      }
    }
    return null;
  }

  getPieceCells(piece) {
    const def = PIECE_TYPES[piece.type];
    const cells = [];
    for (let dy = 0; dy < def.h; dy++) {
      for (let dx = 0; dx < def.w; dx++) {
        cells.push({ gx: piece.gx + dx, gy: piece.gy + dy });
      }
    }
    return cells;
  }

  buildOccupancy(excludeIds = new Set()) {
    const map = new Map();
    for (const piece of this.pieces) {
      if (excludeIds.has(piece.id)) continue;
      for (const { gx, gy } of this.getPieceCells(piece)) {
        map.set(`${gx},${gy}`, piece.id);
      }
    }
    return map;
  }

  hasOccupancyConflict(type, gx, gy, excludeIds = new Set()) {
    const def = PIECE_TYPES[type];
    const occ = this.buildOccupancy(excludeIds);
    for (let dy = 0; dy < def.h; dy++) {
      for (let dx = 0; dx < def.w; dx++) {
        if (occ.has(`${gx + dx},${gy + dy}`)) return true;
      }
    }
    return false;
  }

  canPlacePiece(piece, excludeIds = new Set()) {
    if (this.hasOccupancyConflict(piece.type, piece.gx, piece.gy, excludeIds)) {
      return false;
    }
    const neighbors = this.pieces.filter(
      (p) => p.id !== piece.id && !excludeIds.has(p.id)
    );
    return validateConnectorAdjacency(piece, neighbors);
  }

  canPlace(type, gx, gy, excludeIds = new Set(), variantIndex) {
    const piece = {
      type,
      gx,
      gy,
      variantIndex:
        variantIndex ?? this.getActiveVariantIndex(type),
    };
    return this.canPlacePiece(piece, excludeIds);
  }

  isPlacementPreviewValid() {
    if (!this.placementPreview) return false;
    return this.canPlacePiece(this.placementPreview);
  }

  getBoundingBox() {
    if (this.pieces.length === 0) return null;
    let minGx = Infinity;
    let minGy = Infinity;
    let maxGx = -Infinity;
    let maxGy = -Infinity;
    for (const piece of this.pieces) {
      const def = PIECE_TYPES[piece.type];
      minGx = Math.min(minGx, piece.gx);
      minGy = Math.min(minGy, piece.gy);
      maxGx = Math.max(maxGx, piece.gx + def.w);
      maxGy = Math.max(maxGy, piece.gy + def.h);
    }
    return { minGx, minGy, maxGx, maxGy };
  }

  getContentCenter() {
    const bbox = this.getBoundingBox();
    if (!bbox) return { x: 0, y: 0 };
    const minX = bbox.minGx * CELL;
    const minY = bbox.minGy * CELL;
    const maxX = bbox.maxGx * CELL;
    const maxY = bbox.maxGy * CELL;
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }

  setActiveType(type) {
    this.activeType = type;
    this.clearSelection();
  }

  selectPiece(id, addToSelection = false) {
    if (!addToSelection) this.selectedIds.clear();
    if (this.selectedIds.has(id) && addToSelection) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  clearSelection() {
    this.selectedIds.clear();
    this.placementPreview = null;
  }

  placePiece(type, gx, gy) {
    if (!this.canPlace(type, gx, gy)) return false;
    const def = PIECE_TYPES[type];
    this.pieces.push({
      id: this.nextId++,
      type,
      variantIndex: this.getActiveVariantIndex(type),
      gx,
      gy,
      color: def.color,
    });
    return true;
  }

  deleteSelected() {
    this.pieces = this.pieces.filter((p) => !this.selectedIds.has(p.id));
    this.selectedIds.clear();
    this.placementPreview = null;
  }

  applyColorToSelected(color) {
    for (const piece of this.pieces) {
      if (this.selectedIds.has(piece.id)) piece.color = color;
    }
  }

  getSelectedColor() {
    const first = this.pieces.find((p) => this.selectedIds.has(p.id));
    return first?.color ?? null;
  }

  setPlacementPreviewFromWorld(worldX, worldY) {
    if (this.selectedIds.size > 0) {
      this.placementPreview = null;
      return;
    }
    const def = PIECE_TYPES[this.activeType];
    this.placementPreview = {
      type: this.activeType,
      variantIndex: this.getActiveVariantIndex(),
      gx: Math.floor(worldX / CELL),
      gy: Math.floor(worldY / CELL),
      color: def.color,
    };
  }

  clearPlacementPreview() {
    this.placementPreview = null;
  }

  syncPlacementPreviewWithActive() {
    if (!this.placementPreview || this.selectedIds.size > 0) return;
    const def = PIECE_TYPES[this.activeType];
    this.placementPreview.type = this.activeType;
    this.placementPreview.variantIndex = this.getActiveVariantIndex();
    this.placementPreview.color = def.color;
  }

  tryMoveSelected(dragStartGrid, dragPieceStarts, targetGx, targetGy) {
    const dx = targetGx - dragStartGrid.gx;
    const dy = targetGy - dragStartGrid.gy;

    const tentative = dragPieceStarts.map((start) => {
      const piece = this.findPiece(start.id);
      return { ...piece, gx: start.gx + dx, gy: start.gy + dy };
    });

    const excludeIds = new Set(this.selectedIds);
    const staticPieces = this.pieces.filter((p) => !excludeIds.has(p.id));
    const occupied = new Set();

    for (const p of staticPieces) {
      for (const { gx, gy } of this.getPieceCells(p)) {
        occupied.add(`${gx},${gy}`);
      }
    }

    for (const t of tentative) {
      for (const { gx, gy } of this.getPieceCells(t)) {
        if (occupied.has(`${gx},${gy}`)) return false;
        occupied.add(`${gx},${gy}`);
      }
    }

    for (const t of tentative) {
      const others = [
        ...staticPieces,
        ...tentative.filter((p) => p.id !== t.id),
      ];
      if (!validateConnectorAdjacency(t, others)) return false;
    }

    for (const t of tentative) {
      const piece = this.findPiece(t.id);
      piece.gx = t.gx;
      piece.gy = t.gy;
    }
    return true;
  }

  clampZoom(zoom) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  }
}

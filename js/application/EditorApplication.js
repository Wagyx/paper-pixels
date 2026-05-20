import { PieceVariantPicker } from "./PieceVariantPicker.js";

export class EditorApplication {
  constructor(state, visualization, ui) {
    this.state = state;
    this.viz = visualization;
    this.ui = ui;

    this.isPanning = false;
    this.panStart = { x: 0, y: 0, camX: 0, camY: 0 };

    this.isDraggingPieces = false;
    this.dragStartGrid = null;
    this.dragPieceStarts = null;

    this.variantPicker = new PieceVariantPicker(
      state,
      ui.pieceButtons,
      () => this.onVariantChange()
    );

    this.bindToolbar();
    this.bindCanvas();
    this.bindKeyboard();
    window.addEventListener("resize", () => this.refresh());

    this.refresh();
    this.recenterView();
  }

  onVariantChange() {
    this.refresh();
  }

  refresh() {
    this.viz.render({
      pieces: this.state.pieces,
      selectedIds: this.state.selectedIds,
      camera: this.state.camera,
      placementPreview: this.state.placementPreview,
      placementPreviewValid: this.state.isPlacementPreviewValid(),
      showConnectors: this.state.showConnectors,
      showGrid: this.state.showGrid,
    });
    this.updateToolbarUI();
  }

  updateToolbarUI() {
    const { selectionTools, colorPicker } = this.ui;
    if (this.state.selectedIds.size > 0) {
      selectionTools.classList.remove("hidden");
      const color = this.state.getSelectedColor();
      if (color) colorPicker.value = color;
    } else {
      selectionTools.classList.add("hidden");
    }

    this.variantPicker.syncActiveButtons();
  }

  recenterView() {
    const center = this.state.getContentCenter();
    this.state.camera.x = center.x;
    this.state.camera.y = center.y;
    this.refresh();
  }

  bindToolbar() {
    const {
      recenterBtn,
      colorPicker,
      deleteBtn,
      showConnectorsCheckbox,
      showGridCheckbox,
    } = this.ui;

    showGridCheckbox.addEventListener("change", () => {
      this.state.showGrid = showGridCheckbox.checked;
      this.refresh();
    });

    showConnectorsCheckbox.addEventListener("change", () => {
      this.state.showConnectors = showConnectorsCheckbox.checked;
      this.refresh();
    });

    recenterBtn.addEventListener("click", () => this.recenterView());

    colorPicker.addEventListener("input", (e) => {
      this.state.applyColorToSelected(e.target.value);
      this.viz.updatePiecesOnly(
        this.state.pieces,
        this.state.selectedIds,
        this.state.showConnectors
      );
    });

    deleteBtn.addEventListener("click", () => {
      this.state.deleteSelected();
      this.refresh();
    });
  }

  bindCanvas() {
    const { svg } = this.ui;

    svg.addEventListener("contextmenu", (e) => e.preventDefault());

    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const before = this.viz.clientToWorld(e.clientX, e.clientY);
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.state.camera.zoom = this.state.clampZoom(
          this.state.camera.zoom * factor
        );
        this.viz.applyCamera(this.state.camera);
        const after = this.viz.clientToWorld(e.clientX, e.clientY);
        this.state.camera.x += before.x - after.x;
        this.state.camera.y += before.y - after.y;
        this.refresh();
      },
      { passive: false }
    );

    svg.addEventListener("mousedown", (e) => this.onPointerDown(e));
    svg.addEventListener("mousemove", (e) => this.onPointerMove(e));
    svg.addEventListener("mouseleave", () => {
      this.clearPlacementPreviewUI();
      svg.classList.remove("over-piece");
    });

    window.addEventListener("mouseup", (e) => this.onPointerUp(e));
  }

  bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (this.state.selectedIds.size > 0) {
          e.preventDefault();
          this.state.deleteSelected();
          this.refresh();
        }
      }
      if (e.key === "Escape") {
        this.variantPicker.close();
        this.state.clearSelection();
        this.refresh();
      }
    });
  }

  isPointerOverPlacedPiece(e) {
    if (this.viz.getPieceIdFromTarget(e.target) != null) return true;
    const world = this.viz.clientToWorld(e.clientX, e.clientY);
    const { gx, gy } = this.viz.worldToGrid(world.x, world.y);
    return this.state.findPieceAtCell(gx, gy) != null;
  }

  clearPlacementPreviewUI() {
    this.state.clearPlacementPreview();
    this.viz.renderPreview(null, false);
  }

  onPointerDown(e) {
    if (e.button === 2) {
      this.isPanning = true;
      this.panStart = {
        x: e.clientX,
        y: e.clientY,
        camX: this.state.camera.x,
        camY: this.state.camera.y,
      };
      this.viz.setCursorMode("panning");
      return;
    }

    if (e.button !== 0) return;

    const world = this.viz.clientToWorld(e.clientX, e.clientY);
    const { gx, gy } = this.viz.worldToGrid(world.x, world.y);
    const pieceId = this.viz.getPieceIdFromTarget(e.target);
    const hit =
      pieceId != null
        ? this.state.findPiece(pieceId)
        : this.state.findPieceAtCell(gx, gy);

    if (hit) {
      const multi = e.ctrlKey || e.metaKey;
      if (multi) {
        this.state.selectPiece(hit.id, true);
      } else {
        this.state.selectedIds.clear();
        this.state.selectedIds.add(hit.id);
      }
      this.updateToolbarUI();
      this.viz.renderPieces(this.state.pieces, this.state.selectedIds);

      if (this.state.selectedIds.has(hit.id)) {
        this.startPieceDrag(gx, gy);
      }
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      this.state.clearSelection();
      this.updateToolbarUI();
    }

    if (this.state.placePiece(this.state.activeType, gx, gy)) {
      this.refresh();
    }
  }

  onPointerMove(e) {
    if (this.isPanning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.state.camera.x = this.panStart.camX - dx / this.state.camera.zoom;
      this.state.camera.y = this.panStart.camY - dy / this.state.camera.zoom;
      this.refresh();
      return;
    }

    const world = this.viz.clientToWorld(e.clientX, e.clientY);
    const { gx, gy } = this.viz.worldToGrid(world.x, world.y);

    if (this.isDraggingPieces) {
      const moved = this.state.tryMoveSelected(
        this.dragStartGrid,
        this.dragPieceStarts,
        gx,
        gy
      );
      if (moved) {
        this.viz.updatePiecesOnly(
          this.state.pieces,
          this.state.selectedIds,
          this.state.showConnectors
        );
      }
      return;
    }

    if (
      this.state.selectedIds.size === 0 &&
      this.isPointerOverPlacedPiece(e)
    ) {
      this.clearPlacementPreviewUI();
      this.ui.svg.classList.add("over-piece");
      return;
    }

    this.ui.svg.classList.remove("over-piece");

    if (this.state.selectedIds.size > 0) {
      this.clearPlacementPreviewUI();
      return;
    }

    this.state.setPlacementPreviewFromWorld(world.x, world.y);
    this.viz.renderPreview(
      this.state.placementPreview,
      this.state.isPlacementPreviewValid(),
      this.state.showConnectors
    );
  }

  onPointerUp(e) {
    if (e.button === 2) {
      this.isPanning = false;
      this.viz.setCursorMode(null);
    }
    if (e.button === 0) {
      this.isDraggingPieces = false;
      this.dragStartGrid = null;
      this.dragPieceStarts = null;
      this.viz.setCursorMode(null);
    }
  }

  startPieceDrag(gx, gy) {
    this.isDraggingPieces = true;
    this.dragStartGrid = { gx, gy };
    this.dragPieceStarts = this.state.pieces
      .filter((p) => this.state.selectedIds.has(p.id))
      .map((p) => ({ id: p.id, gx: p.gx, gy: p.gy }));
    this.viz.setCursorMode("dragging-pieces");
  }
}

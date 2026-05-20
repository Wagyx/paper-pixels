import { PIECE_TYPES } from "../config.js";
import { getVariantConnectors } from "./connectors.js";
import {
  countUnsatisfiedConnections,
  validateConnectorAdjacencyConnected,
} from "./connectorCompatibility.js";

/** @param {string} type @param {number} variantIndex */
export function isAllFemaleVariant(type, variantIndex) {
  return getVariantConnectors(type, variantIndex).every((kind) => kind === 0);
}

/** @param {string} type @returns {number | null} */
export function getAllFemaleVariantIndex(type) {
  const def = PIECE_TYPES[type];
  if (!def) return null;
  const index = def.variants.findIndex((variant) =>
    variant.connectors.every((kind) => kind === 0)
  );
  return index >= 0 ? index : null;
}

function clonePieces(pieces) {
  return pieces.map((piece) => ({ ...piece }));
}

function snapshotIfBetter(working, bestPieces, bestCount) {
  const count = countUnsatisfiedConnections(working);
  if (count < bestCount) {
    return { pieces: clonePieces(working), count };
  }
  return { pieces: bestPieces, count: bestCount };
}

function maleConnectorCount(type, variantIndex) {
  return getVariantConnectors(type, variantIndex).filter((kind) => kind === 1)
    .length;
}

function rankedVariantIndices(type) {
  const def = PIECE_TYPES[type];
  if (!def) return [];
  return def.variants
    .map((_, index) => index)
    .sort((a, b) => {
      const aAll = isAllFemaleVariant(type, a);
      const bAll = isAllFemaleVariant(type, b);
      if (aAll !== bAll) return aAll ? 1 : -1;
      return maleConnectorCount(type, b) - maleConnectorCount(type, a);
    });
}

function minimizeUnsatisfiedConnections(working, bestPieces, bestCount) {
  let best = bestPieces;
  let count = bestCount;
  const maxPasses = Math.max(working.length * 6, 12);

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (const piece of working) {
      const previous = piece.variantIndex;
      let localBest = previous;
      let localBestCount = countUnsatisfiedConnections(working);

      for (const variantIndex of rankedVariantIndices(piece.type)) {
        piece.variantIndex = variantIndex;
        const trialCount = countUnsatisfiedConnections(working);
        if (trialCount < localBestCount) {
          localBestCount = trialCount;
          localBest = variantIndex;
        }
      }

      piece.variantIndex = localBest;
      if (localBest !== previous) improved = true;

      const snap = snapshotIfBetter(working, best, count);
      best = snap.pieces;
      count = snap.count;
    }

    if (!improved) break;
  }

  return { pieces: best, count };
}

/**
 * Two-phase variant solver, then local search for the fewest unsatisfied edges.
 * Always returns the best layout found (even when not fully solved).
 *
 * @param {object[]} pieces - placed pieces with id, type, gx, gy, variantIndex
 */
export function solvePieceVariants(pieces) {
  if (pieces.length === 0) {
    return {
      pieces: [],
      success: true,
      unsatisfiedConnections: 0,
      upgradedCount: 0,
    };
  }

  const working = pieces.map((piece) => ({ ...piece }));

  for (const piece of working) {
    const allFemaleIndex = getAllFemaleVariantIndex(piece.type);
    if (allFemaleIndex != null) {
      piece.variantIndex = allFemaleIndex;
    }
  }

  let bestPieces = clonePieces(working);
  let bestCount = countUnsatisfiedConnections(working);

  const neighborsOf = (piece) =>
    working.filter((other) => other.id !== piece.id);

  const maxPasses = Math.max(working.length * 4, 8);

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (const piece of working) {
      const neighbors = neighborsOf(piece);
      const connected = validateConnectorAdjacencyConnected(piece, neighbors);
      const allFemale = isAllFemaleVariant(piece.type, piece.variantIndex);

      if (connected && !allFemale) continue;

      let bestTrial = null;
      let bestTrialCount = bestCount;

      for (const variantIndex of rankedVariantIndices(piece.type)) {
        if (variantIndex === piece.variantIndex) continue;

        const previous = piece.variantIndex;
        piece.variantIndex = variantIndex;
        const trialCount = countUnsatisfiedConnections(working);
        piece.variantIndex = previous;

        if (trialCount < bestTrialCount) {
          bestTrialCount = trialCount;
          bestTrial = variantIndex;
        }
      }

      if (bestTrial != null) {
        piece.variantIndex = bestTrial;
        changed = true;
        const snap = snapshotIfBetter(working, bestPieces, bestCount);
        bestPieces = snap.pieces;
        bestCount = snap.count;
      }
    }

    if (!changed) break;
  }

  const refined = minimizeUnsatisfiedConnections(working, bestPieces, bestCount);
  bestPieces = refined.pieces;
  bestCount = refined.count;

  const upgradedCount = bestPieces.filter(
    (piece) => !isAllFemaleVariant(piece.type, piece.variantIndex)
  ).length;

  return {
    pieces: bestPieces,
    success: bestCount === 0,
    unsatisfiedConnections: bestCount,
    upgradedCount,
  };
}

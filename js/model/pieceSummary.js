import { PIECE_TYPE_ORDER, PIECE_TYPES } from "../config.js";
import { getVariant } from "./connectors.js";
import {
  areConnectorsRotationEquivalent,
  canonicalConnectorKeyForVariant,
} from "./variantRotation.js";

/** @typedef {{ representativeIndex: number, variantIndices: number[], canonicalKey: string, label: string }} VariantClass */

const classesByType = new Map();

function formatVariantNames(type, indices) {
  const def = PIECE_TYPES[type];
  const names = indices
    .map((index) => def.variants[index].name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const primary = names[0];
  if (names.length === 1) return primary;
  return `${primary} (= ${names.slice(1).join(", ")})`;
}

function buildVariantClasses(type) {
  const def = PIECE_TYPES[type];
  const classes = [];
  const assigned = new Set();

  for (let i = 0; i < def.variants.length; i++) {
    if (assigned.has(i)) continue;

    const family = [i];
    assigned.add(i);

    for (let j = i + 1; j < def.variants.length; j++) {
      if (assigned.has(j)) continue;
      if (
        areConnectorsRotationEquivalent(
          type,
          def.variants[i].connectors,
          def.variants[j].connectors
        )
      ) {
        family.push(j);
        assigned.add(j);
      }
    }

    family.sort((a, b) => a - b);
    const representativeIndex = family[0];
    classes.push({
      representativeIndex,
      variantIndices: family,
      canonicalKey: canonicalConnectorKeyForVariant(type, representativeIndex),
      label: formatVariantNames(type, family),
    });
  }

  classes.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return classes;
}

function getVariantClasses(type) {
  if (!classesByType.has(type)) {
    classesByType.set(type, buildVariantClasses(type));
  }
  return classesByType.get(type);
}

function lookupVariantClass(type, variantIndex) {
  const classes = getVariantClasses(type);
  return (
    classes.find((variantClass) => variantClass.variantIndices.includes(variantIndex)) ??
    null
  );
}

/**
 * @param {object[]} pieces - placed pieces with type, variantIndex, color
 * @returns {{ type: string, typeLabel: string, variantLabel: string, representativeIndex: number, color: string, count: number }[]}
 */
export function buildPiecesSummary(pieces) {
  const groups = new Map();

  for (const piece of pieces) {
    const variantClass = lookupVariantClass(piece.type, piece.variantIndex);
    const canonicalKey = variantClass?.canonicalKey ?? `raw:${piece.variantIndex}`;
    const representativeIndex =
      variantClass?.representativeIndex ?? piece.variantIndex;
    const variantLabel =
      variantClass?.label ??
      getVariant(piece.type, piece.variantIndex).variant.name;
    const groupKey = `${piece.type}\0${canonicalKey}\0${piece.color}`;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(groupKey, {
        type: piece.type,
        typeLabel: piece.type.replace("x", "×"),
        variantLabel,
        representativeIndex,
        color: piece.color,
        count: 1,
      });
    }
  }

  const rows = [...groups.values()];
  rows.sort((a, b) => {
    const typeOrder =
      PIECE_TYPE_ORDER.indexOf(a.type) - PIECE_TYPE_ORDER.indexOf(b.type);
    if (typeOrder !== 0) return typeOrder;
    const variantOrder = a.variantLabel.localeCompare(
      b.variantLabel,
      undefined,
      { numeric: true }
    );
    if (variantOrder !== 0) return variantOrder;
    return a.color.localeCompare(b.color);
  });

  return rows;
}

export function getTotalPieceCount(pieces) {
  return pieces.length;
}

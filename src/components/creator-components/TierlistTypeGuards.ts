import { PixelCrop } from "react-image-crop";
import { DndTierlistImageData, TierlistElementType, DndTierlistRowData, DndTierlistRowEmptySpaceData, DndTierlistReserveEmptySpaceData, TierlistTemplate, Tierlist, TierlistRow, TierlistImage, TierlistImageCaption, TierlistReserve } from "./TierlistTypes";

export function isDndTierlistImageData(data: any): data is DndTierlistImageData {
  return (
    typeof data.imageIndex === 'number' &&
    (data.rowIndex === undefined || typeof data.rowIndex === 'number') &&
    data.elementData?.type === TierlistElementType.TierlistImage &&
    typeof data.elementData.id === 'string'
  );
}

export function isDndTierlistRowData(data: any): data is DndTierlistRowData {
  return (
    data.imageIndex === undefined &&
    typeof data.rowIndex === 'number' &&
    data.elementData?.type === TierlistElementType.TierlistRow &&
    typeof data.elementData.id === 'string' &&
    typeof data.elementData.label === 'string' &&
    Array.isArray(data.elementData.items) &&
    data.elementData.items.every(isTierlistImage)
  );
}

export function isDndTierlistRowEmptySpaceData(data: any): data is DndTierlistRowEmptySpaceData {
  return (
    data.imageIndex === undefined &&
    typeof data.rowIndex === 'number' &&
    data.elementData?.type === TierlistElementType.TierlistRowEmptySpace &&
    typeof data.elementData.id === 'string'
  );
}

export function isDndTierlistReserveEmptySpaceData(data: any): data is DndTierlistReserveEmptySpaceData {
  return (
    data.imageIndex === undefined &&
    data.rowIndex === undefined &&
    data.elementData?.type === TierlistElementType.TierlistReserveEmptySpace &&
    typeof data.elementData.id === 'string'
  );
}

export function isTierlistTemplate(obj: any): obj is TierlistTemplate {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    typeof obj.templateTitle !== 'string' ||
    typeof obj.tierlist !== 'object' ||
    typeof obj.tierlistReserve !== 'object'
  ) {
    return false;
  }

  if (obj.isPrivate !== undefined && typeof obj.isPrivate !== 'boolean') {
    return false;
  }

  if (obj.templateID !== undefined && typeof obj.templateID !== 'string') {
    return false;
  }

  if (obj.tierlistID !== undefined && typeof obj.tierlistID !== 'string') {
    return false;
  }

  if (obj.tierlistTitle !== undefined && typeof obj.tierlistTitle !== 'string') {
    return false;
  }

  if (obj.owner !== undefined && typeof obj.owner !== 'string') {
    return false;
  }

  return isTierlist(obj.tierlist) && isTierlistReserve(obj.tierlistReserve);
}

function isTierlist(obj: any): obj is Tierlist {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.rows) &&
    obj.rows.every(isTierlistRow)
  );
}

function isTierlistRow(obj: any): obj is TierlistRow {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.label === 'string' &&
    Array.isArray(obj.items) &&
    obj.items.every(isTierlistImage) &&
    obj.type === TierlistElementType.TierlistRow
  );
}

function isTierlistImage(obj: any): obj is TierlistImage {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    (obj.imageUrl === undefined || typeof obj.imageUrl === 'string') &&
    (obj.proxiedImageUrl === undefined || typeof obj.proxiedImageUrl === 'string') &&
    (obj.crop === undefined || isPixelCrop(obj.crop)) &&
    (obj.croppedImageUrl === undefined || typeof obj.croppedImageUrl === 'string') &&
    (obj.caption === undefined || isTierlistImageCaption(obj.caption)) &&
    obj.type === TierlistElementType.TierlistImage
  );
}

function isPixelCrop(obj: any): obj is PixelCrop {
  return (
    typeof obj === 'object' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number' &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    (obj.displayWidth === undefined || typeof obj.displayWidth === 'number') &&
    (obj.displayHeight === undefined || typeof obj.displayHeight === 'number')
  );
}

function isTierlistImageCaption(obj: any): obj is TierlistImageCaption {
  return (
    typeof obj === 'object' &&
    (obj.topText === undefined || typeof obj.topText === 'string') &&
    typeof obj.topTextScale === 'number' &&
    typeof obj.topTextYPos === 'number' &&
    (obj.bottomText === undefined || typeof obj.bottomText === 'string') &&
    typeof obj.bottomTextScale === 'number' &&
    typeof obj.bottomTextYPos === 'number'
  );
}

function isTierlistReserve(obj: any): obj is TierlistReserve {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.items) &&
    obj.items.every(isTierlistImage) &&
    obj.type === TierlistElementType.TierlistReserve
  );
}
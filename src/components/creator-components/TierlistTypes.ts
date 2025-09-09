import { TierlistRowComponentProps } from "./TierlistRow";

enum TierlistElementType {
    TierlistRow, TierlistReserve, TierlistImage, TierlistRowEmptySpace, TierlistReserveEmptySpace
}

type TierlistTemplate = {
    tierlist: Tierlist;
    tierlistReserve: TierlistReserve;
    templateID?: string;
    tierlistID?: string;
    templateTitle: string;
    tierlistTitle?: string;
    isPrivate?: boolean;
    owner?: string;
    deleted?: boolean;
}

type Tierlist = {
    rows: TierlistRow[];
}

type TierlistRow = {
    id: string;
    label: string
    items: TierlistImage[];
    type: TierlistElementType.TierlistRow;
}

type PixelCrop = {
    width: number;
    height: number;
    x: number;
    y: number;
    displayWidth?: number;
    displayHeight?: number;
  };

type TierlistImage = {
    id: string;
    imageUrl?: string;
    proxiedImageUrl?: string;
    crop?: PixelCrop;
    croppedImageUrl?: string;
    caption?: TierlistImageCaption;
    type: TierlistElementType.TierlistImage;
}

type TierlistImageCaption = {
    topText?: string;
    topTextScale: number;
    topTextYPos: number; 
    bottomText?: string;
    bottomTextScale: number;
    bottomTextYPos: number; 
};

type TierlistRowEmptySpace = {
    id: string;
    type: TierlistElementType.TierlistRowEmptySpace;
}

type TierlistReserveEmptySpace = {
    id: string;
    type: TierlistElementType.TierlistReserveEmptySpace;
}

type TierlistReserve = {
    items: TierlistImage[];
    type: TierlistElementType.TierlistReserve;
}

type DndTierlistImageData = {
    imageIndex: number; 
    rowIndex?: number;
    elementData: TierlistImage; 
};
  
type DndTierlistRowData = {
    imageIndex?: never; 
    rowIndex: TierlistRowComponentProps["rowIndex"];
    elementData: TierlistRow; 
};

type DndTierlistRowEmptySpaceData = {
    imageIndex?: never; 
    rowIndex: number;
    elementData: TierlistRowEmptySpace; 
};

type DndTierlistReserveEmptySpaceData = {
    imageIndex?: never; 
    rowIndex?: never;
    elementData: TierlistReserveEmptySpace;
};
  
type TierlistTemplatePayload = {
    template: TierlistTemplate;
    isOwner?: boolean;
}

export { TierlistElementType };
export type { 
    Tierlist, 
    TierlistRow, 
    TierlistImage, 
    TierlistRowEmptySpace,
    TierlistReserveEmptySpace,
    TierlistReserve, 
    TierlistTemplate,
    PixelCrop, 
    TierlistTemplatePayload, 
    DndTierlistImageData,
    DndTierlistRowData,
    DndTierlistRowEmptySpaceData,
    DndTierlistReserveEmptySpaceData,
    TierlistImageCaption
};

import { createContext, Dispatch, SetStateAction } from 'react';
import { TierlistImage, TierlistRow, TierlistTemplate } from './TierlistTypes';
import { TierlistRowComponentProps } from './TierlistRow';

export interface ImageFlags {
  hasError?: boolean;
  markedForDeletion?: boolean;
}

interface TierlistTemplateContextProps {
  activeElement: TierlistRow | TierlistImage | null;
  setActiveElement: Dispatch<SetStateAction<TierlistRow | TierlistImage | null>>;
  
  activeElementRow: TierlistRowComponentProps["rowIndex"] | null;
  setActiveElementRow: Dispatch<SetStateAction<TierlistRowComponentProps["rowIndex"] | null>>;
  
  tierlistTemplate: TierlistTemplate | undefined;
  setTierlistTemplate: Dispatch<SetStateAction<TierlistTemplate | undefined>>;
  
  tierlistID?: string | null;
  
  isTemplateOwner: boolean | undefined;
  setIsTemplateOwner: Dispatch<SetStateAction<boolean | undefined>>;
  
  imageFlags: Record<string, ImageFlags>;
  setImageFlag: (
    imageId: string,
    flagUpdater: Partial<ImageFlags> | ((prevFlags: ImageFlags) => Partial<ImageFlags>) | null
  ) => void;

  isDeletionMode: boolean;
  setDeletionMode: Dispatch<SetStateAction<boolean>>;

  isInteractivityOff: boolean
  }

export const TierlistTemplateContext = createContext<TierlistTemplateContextProps>({
  activeElement: null,
  setActiveElement: () => {},
  
  activeElementRow: null,
  setActiveElementRow: () => {},
  
  tierlistTemplate: undefined,
  setTierlistTemplate: () => {},
  
  tierlistID: null,
  
  isTemplateOwner: undefined,
  setIsTemplateOwner: () => {},
  
  imageFlags: {}, // Initialize as an empty object
  setImageFlag: () => {},

  isDeletionMode: false,
  setDeletionMode: () => {},

  isInteractivityOff: false,
});

import { TierlistElementType, TierlistImage, TierlistTemplate, TierlistTemplatePayload } from '@/components/creator-components/TierlistTypes';
import { getTierlist, proxyImage, putTemplate, PutTemplateResponse, apiSaveTierlist, SaveTierlistResponse, getTemplate, showLoginPrompt } from './apiUtils';
import { v4 as uuidv4 } from 'uuid';
import { isDomainTotallyUnhealthy, markDomainFailure } from '../domainTracker';
import { getCroppedImg } from '../cropimage';

const DEFAULT_TEMPLATE: TierlistTemplate = {
    tierlist: {
        rows: [
            {
                id: uuidv4(),
                label: 'S',
                items: [],
                type: TierlistElementType.TierlistRow
            },
            {
                id: uuidv4(),
                label: 'A',
                items: [],
                type: TierlistElementType.TierlistRow
            },
            {
                id: uuidv4(),
                label: 'B',
                items: [],
                type: TierlistElementType.TierlistRow
            },
            {
                id: uuidv4(),
                label: 'C',
                items: [],
                type: TierlistElementType.TierlistRow
            },
            {
                id: uuidv4(),
                label: 'D',
                items: [],
                type: TierlistElementType.TierlistRow
            }
        ]
    },
    tierlistReserve: {
        items: [],
        type: TierlistElementType.TierlistReserve
    },
    templateID: undefined,
    tierlistID: undefined,
    templateTitle: "New Template",
};

const WIP_TEMPLATE_KEY: string = "wipTemplate";
const WIP_TIERLIST_KEY: string = "wipTierlist";

const LOCAL_STORAGE_KEY = (templateKey: string, tierlistKey: string): string =>
    `${templateKey}_${tierlistKey}`;

export const fetchTierlist = async (tierlistID: TierlistTemplate['tierlistID']): Promise<{ tierlist: TierlistTemplate, hadErrors: boolean }> => {
    if (!tierlistID) {
        throw new Error("Tierlist ID is required");
    }

    const tierlist = await getTierlist(tierlistID);
    const imageResult = await fetchImagesForTemplate(tierlist);
    return { tierlist: imageResult.updatedTemplate, hadErrors: imageResult.hadErrors };
};

export const fetchTierlistTemplate = async (templateID?: TierlistTemplate['templateID']): Promise<{ payload: TierlistTemplatePayload, hadErrors: boolean }> => {
    let tierlistTemplate: TierlistTemplate;
    let tierlistTemplatePayload: TierlistTemplatePayload | undefined = undefined;
    let hadErrors = false;

    const localTemplate = fetchTemplateFromLocalStorage(
        LOCAL_STORAGE_KEY(templateID || WIP_TEMPLATE_KEY, WIP_TIERLIST_KEY)
    ) ?? DEFAULT_TEMPLATE;

    if (templateID) {
        tierlistTemplatePayload = await getTemplate(templateID);
        tierlistTemplate = mergeRemoteAndLocalTemplates(tierlistTemplatePayload.template, localTemplate);

        const imageResult = await fetchImagesForTemplate(tierlistTemplate);
        tierlistTemplate = imageResult.updatedTemplate;
        hadErrors = imageResult.hadErrors;

        tierlistTemplate = updateMiscTemplateData(tierlistTemplate, tierlistTemplatePayload.template);
    } else {
        const imageResult = await fetchImagesForTemplate(localTemplate);
        tierlistTemplate = imageResult.updatedTemplate;
        hadErrors = imageResult.hadErrors;
    }

    return { payload: { template: tierlistTemplate, isOwner: tierlistTemplatePayload?.isOwner || undefined }, hadErrors };
};

  

export const saveTierlist = async (tierlistTemplatePayload: TierlistTemplatePayload): Promise<ReturnType<typeof apiSaveTierlist> | null> => {
    const putTierlistResponse = await apiSaveTierlist(tierlistTemplatePayload.template);
    //saveTierlistToLocalStorage(tierlistTemplatePayload.template);
    return putTierlistResponse;
};

export const saveTemplate = async (tierlistTemplatePayload: TierlistTemplatePayload): Promise<ReturnType<typeof putTemplate> | null> => { 
    let putTemplateResponse: PutTemplateResponse | null = null; 
    if (tierlistTemplatePayload.isOwner) {
        putTemplateResponse = await putTemplate(moveTierlistItemsToReserve(tierlistTemplatePayload.template));
    }
    saveTemplateToLocalStorage(putTemplateResponse?.templateID, tierlistTemplatePayload.template);
    return putTemplateResponse;
};


const fetchTemplateFromLocalStorage = (templateKey: string): TierlistTemplate | null => {
    const templateJson = localStorage.getItem(templateKey);

    if (templateJson) {
        try {
            const template = JSON.parse(templateJson) as TierlistTemplate;

            if (template.owner) {
                delete template.owner;
            }

            return template;
        } catch {
            return null;
        }
    }
    return null;
};


const saveTemplateToLocalStorage = (
    tierlistKey: TierlistTemplate["templateID"],
    tierlistTemplate: TierlistTemplate
  ): void => {
    const sanitizedTemplate = tierlistTemplate.templateID
      ? tierlistTemplate
      : { ...tierlistTemplate, owner: undefined };
  
    const templateJson = JSON.stringify(sanitizedTemplate);
  
    localStorage.setItem(
      LOCAL_STORAGE_KEY(tierlistKey || WIP_TEMPLATE_KEY, WIP_TIERLIST_KEY),
      templateJson
    );
  };
  

const saveTierlistToLocalStorage = (tierlistTemplate: TierlistTemplate): void => {
    const tierlistJson = JSON.stringify(tierlistTemplate);
    localStorage.setItem(
        LOCAL_STORAGE_KEY(tierlistTemplate?.templateID || WIP_TEMPLATE_KEY, tierlistTemplate?.tierlistID || WIP_TIERLIST_KEY),
        tierlistJson
    );
};

const mergeRemoteAndLocalTemplates = (remoteTemplate: TierlistTemplate, localTemplate: TierlistTemplate): TierlistTemplate => {
    const collectImages = (template: TierlistTemplate): Record<string, TierlistImage> => {
        const imageMap: Record<string, TierlistImage> = {};

        template.tierlist.rows.forEach((row) => {
            row.items.forEach((image) => {
                imageMap[image.id] = image;
            });
        });

        template.tierlistReserve.items.forEach((image) => {
            imageMap[image.id] = image;
        });

        return imageMap;
    };

    const remoteTemplateImagesMap = collectImages(remoteTemplate);

    const compareAndRemoveImages = (localTemplate: TierlistTemplate, remoteImagesMap: Record<string, TierlistImage>) => {
        localTemplate.tierlist.rows.forEach((row) => {
            row.items = row.items.filter((image) => {
                if (remoteImagesMap[image.id]) {
                    delete remoteImagesMap[image.id];
                    return true;
                }
                return false;
            });
        });

        localTemplate.tierlistReserve.items = localTemplate.tierlistReserve.items.filter((image) => {
            if (remoteImagesMap[image.id]) {
                delete remoteImagesMap[image.id];
                return true;
            }
            return false;
        });
    };

    compareAndRemoveImages(localTemplate, remoteTemplateImagesMap);

    Object.values(remoteTemplateImagesMap).forEach((remainingImage) => {
        localTemplate.tierlistReserve.items.push(remainingImage);
    });

    return localTemplate;
};

export const fetchWithTimeout = async (url: string, timeoutMs = 5000): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
};

type FetchImagesResult = {
    updatedTemplate: TierlistTemplate;
    hadErrors: boolean;
  };
  
  export const fetchImagesForTemplate = async (tierlistTemplate: TierlistTemplate): Promise<FetchImagesResult> => {
    const updatedTemplate = {
      ...tierlistTemplate,
      tierlist: {
        ...tierlistTemplate.tierlist,
        rows: tierlistTemplate.tierlist.rows.map((row) => ({
          ...row,
          items: [...row.items],
        })),
      },
      tierlistReserve: {
        ...tierlistTemplate.tierlistReserve,
        items: [...tierlistTemplate.tierlistReserve.items],
      },
    };
  
    let errorOccurred = false;
    let counter = 0;
    const fetchAndMaybeProxyImage = async (imageUrl: string): Promise<string | undefined> => {
      const domain = extractDomain(imageUrl);
  
      if (domain && isDomainTotallyUnhealthy(domain)) {
        errorOccurred = true;
        return undefined;
      }
  
      try {
        counter++;
        const response = await fetchWithTimeout(imageUrl, 5000);
        if (!response.ok) 
        {
          throw new Error("Direct fetch failed");
        }
        return undefined;
      } catch {
        if (domain) markDomainFailure(domain, 'direct');
      }
  
      try {
        return await proxyImage(imageUrl);
      } catch {
        errorOccurred = true;
        if (domain) markDomainFailure(domain, 'proxy');
        return undefined;
      }
    };
  
  const fetchImageWithFallback = async (image: TierlistImage): Promise<TierlistImage> => {
    let proxiedImageUrl = image.proxiedImageUrl;

    if (image.imageUrl) {
      proxiedImageUrl = await fetchAndMaybeProxyImage(image.imageUrl);
    }

    // If crop info exists but no cropped image yet, generate one
    if (image.crop && image.imageUrl) {
      try {
        const croppedBlob = await getCroppedImg(proxiedImageUrl ?? image.imageUrl, image.crop);
        const croppedImageUrl = URL.createObjectURL(croppedBlob);
        return { ...image, proxiedImageUrl, croppedImageUrl };
      } catch (err) {
        console.error("Error cropping image during fetch:", err);
      }
    }

    return { ...image, proxiedImageUrl };
  };

  
    updatedTemplate.tierlistReserve.items = await Promise.all(
      updatedTemplate.tierlistReserve.items.map(fetchImageWithFallback)
    );
  
    updatedTemplate.tierlist.rows = await Promise.all(
      updatedTemplate.tierlist.rows.map(async (row) => {
        const updatedItems = await Promise.all(row.items.map(fetchImageWithFallback));
        return { ...row, items: updatedItems };
      })
    );
  
    return {
      updatedTemplate,
      hadErrors: errorOccurred,
    };
  };
  

const moveTierlistItemsToReserve = (tierlistTemplate: TierlistTemplate): TierlistTemplate => {
    const updatedTemplate = {
        ...tierlistTemplate,
        tierlist: {
            ...tierlistTemplate.tierlist,
            rows: [...tierlistTemplate.tierlist.rows],
        },
        tierlistReserve: {
            ...tierlistTemplate.tierlistReserve,
            items: [...tierlistTemplate.tierlistReserve.items],
        }
    };

    updatedTemplate.tierlist.rows.forEach(row => {
        updatedTemplate.tierlistReserve.items.push(...row.items);
    });

    updatedTemplate.tierlist.rows = [];

    return updatedTemplate;
};

const updateMiscTemplateData = (template: TierlistTemplate, remoteTemplate: TierlistTemplate): TierlistTemplate => {
    const updatedTemplate: TierlistTemplate = {
        ...template, // Copy existing data from the current template
        owner: remoteTemplate.owner, // Replace with remoteTemplate data
        isPrivate: remoteTemplate.isPrivate,
        templateTitle: remoteTemplate.templateTitle,
        tierlistID: remoteTemplate.tierlistID,
        templateID: remoteTemplate.templateID,
    };

    return updatedTemplate;
};

export function extractDomain(url: string): string | undefined {
    try {
        return new URL(url).hostname;
    } catch {
        return undefined;
    }
}

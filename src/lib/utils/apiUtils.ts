import axios from '@/lib/axiosConfig';
import { TierlistTemplate, TierlistTemplatePayload } from '@/components/creator-components/TierlistTypes';
import { isAxiosError } from 'axios';
import { eventBus } from '../eventBus';

const handleRequest = async (request: () => Promise<any>): Promise<any> => {
  try {
    const response = await request();
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response) {
        if (err.response.status === 401) {
          showLoginPrompt();
        }
        throw new Error(err.response.data?.message || err.response.data?.error || `API error ${err.response.status}`);
      } else if (err.request) {
        throw new Error('No response received from API');
      }
      throw new Error(err.message);
    }
    throw new Error('Unknown network error');
  }
};

export const showLoginPrompt = (): void => {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem('displayName');
    }
    eventBus.emit('openLoginDialog', { header: 'You are not logged in', body: 'You need to login to perform this action' });
};

export const getTierlist = async (tierlistID: string): Promise<TierlistTemplate> => {
  return handleRequest(() => axios.get(`tierlist?tierlistID=${tierlistID}`)).then(res => res.template);
};


export const getTemplate = async (templateID: string): Promise<TierlistTemplatePayload> => {
  return handleRequest(() => axios.get(`template`, {params: { templateID },}));
};


export const getUserTemplates = async (): Promise<TierlistTemplate[]> => {
  return handleRequest(() => axios.get('user-templates'));
};

export const getUserTierlists = async (): Promise<TierlistTemplate[]> => {
  return handleRequest(() => axios.get('user-tierlists'));
};


interface UpdateTemplateVisibilityPayload {
    templateID: string;
    isPrivate: boolean;
}

export const changeTemplateVisibility = async (payload: UpdateTemplateVisibilityPayload) => {
    return handleRequest(() => axios.put(`changeTemplateVisibility`, payload));
};

interface UpdateTierlistVisibility {
    tierlistID: string;
    isPrivate: boolean;
}
    
export const changeTierlistVisibility = async (payload: UpdateTierlistVisibility) => {
    return handleRequest(() => axios.put(`changeTierlistVisibility`, payload));
};

export const deleteTemplate = async (templateID: string): Promise<void> => {
return handleRequest(() =>
    axios.delete(`/template`, { params: { templateID } })
    );
};
  

export const deleteTierlist = async (tierlistID: string): Promise<void> => {
return handleRequest(() =>
    axios.delete(`/tierlist`, { params: { tierlistID } })
    );
};
  

export type SaveTierlistResponse =
  | { status: "success", tierlistID: string }  
  | { status: "fail", tierlistID: undefined }; 

export const apiSaveTierlist = async (tierlist: TierlistTemplate): Promise<SaveTierlistResponse>  => {
    if (!tierlist.templateID) throw new Error("Can't update tierlist without a templateID");
    return handleRequest(() => axios.post(`/tierlist`, tierlist));
};

export type PutTemplateResponse =
  | { status: "success"; templateID: string }  
  | { status: "fail"; templateID: undefined }; 

export const putTemplate = async (tierlistTemplate: TierlistTemplate): Promise<PutTemplateResponse> => {
    return handleRequest(() => axios.put(`/template`, tierlistTemplate));
};

export const proxyImage = async (url: string) => {
    try {
        const response = await axios.get('/proxy', { 
        params: { url }, 
        responseType: 'blob', // Ensures response is a Blob (binary data)
        });

        const objectUrl = URL.createObjectURL(response.data);

        return objectUrl; 
    } catch (error) {
        throw error;
    }
};
  
export const createTierlist = async (tierlist: TierlistTemplate) => {
    return handleRequest(() => axios.post('/tierlist', tierlist));
};

export const getTemplates = async () => {
    return handleRequest(() => axios.get('/user/templates'));
};

export const togglePublic = async (tierlistID: string, isPublic: boolean) => {
    return handleRequest(() => axios.put(`tierlist/${tierlistID}`, { isPublic }));
};

export const uploadImage = async (file: File): Promise<{imageId: string}> => {
    const formData = new FormData();
    formData.append("image", file);

    return handleRequest(async () => axios.post("/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }));
};

export const getUserImages = async (): Promise<{ imageId: string; url: string }[]> => {
    return handleRequest(() => axios.get(`/user-images`));
};

export const getUserImageCount = async (): Promise<number> => {
    return handleRequest(async () => {
        const response = await axios.get("/countImages");
        return response.data.imageCount; 
    });
};

export const deleteUserImages = async (imageIds: string[]): Promise<void> => {
    return handleRequest(() =>
        axios.delete("/image", { data: { imageIds } }) 
    );
};

export const purgeUsersByUid = async (uids: string[]): Promise<void> => {
  return handleRequest(() => axios.post("/admin/purge-users", { uids }));
};

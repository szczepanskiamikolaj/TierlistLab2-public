import { PutTemplateResponse, SaveTierlistResponse } from "@/lib/utils/apiUtils";
import { handleError } from "@/lib/utils/errorUtils";
import { saveTemplate, saveTierlist } from "@/lib/utils/storageUtils";
import { Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, DialogActions, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useState, useContext, useEffect } from "react";
import { TierlistTemplateContext } from "../TierlistTemplateContext";
import { TierlistTemplate } from "../TierlistTypes";

interface SavePromptProps {
    open: boolean;
    onClose: () => void; 
    type: "template" | "tierlist";
}

const SavePrompt: React.FC<SavePromptProps> = ({ open, onClose, type }) => {
    const [isPrivate, setIsPrivate] = useState(true);
    const router = useRouter();
    const { tierlistTemplate, setTierlistTemplate } = useContext(TierlistTemplateContext);
    const [templateTitle, setTemplateTitle ] = useState(tierlistTemplate?.templateTitle);
    const [tierlistTitle, setTierlistTitle] = useState(tierlistTemplate?.tierlistTitle);
    const [save, setSave] = useState<boolean>(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if(!templateTitle || !tierlistTemplate || !save) return;

        const updatedTierlistTemplate: TierlistTemplate = {
            ...tierlistTemplate,
            templateTitle: templateTitle,
            tierlistTitle: tierlistTitle,
            isPrivate: isPrivate
        };

        setTierlistTemplate(updatedTierlistTemplate)
    }, [save])

    useEffect(() => {
        const handleSaveTemplate = async () => {     
            try {
                const response: PutTemplateResponse | null = await saveTemplate( {template: tierlistTemplate as TierlistTemplate, isOwner: true});
                if( response?.status == "success" )
                {
                    enqueueSnackbar('Template saved succesffully, redirecting', {variant: "success"});
                    const path = `/${type}/${response.templateID}`;
                    router.push(path)
                }
            } catch (error) {
                enqueueSnackbar('Error saving template:' + handleError(error),{variant: "error"});
                setSave(false);
            }
        };
        
        const handleSaveTierlist = async () => {
            try {
                if (!tierlistTemplate?.templateID) {
                    throw new Error("Template ID is missing. Please ensure the template is saved before saving the tierlist.");
                }
        
                const response: SaveTierlistResponse | null = await saveTierlist({ template: tierlistTemplate as TierlistTemplate, isOwner: true });
                
                if (response?.status === "success") {
                    enqueueSnackbar('Tierlist saved successfully with ID: ' + response.tierlistID, { variant: "success" });
                }
            } catch (error) {
                enqueueSnackbar('Error saving tierlist: ' + handleError(error), { variant: "error" });
                setSave(false);
            }
        };
        

        if(save && type == "template") handleSaveTemplate()
        if(save && type == "tierlist") handleSaveTierlist()
    }, [tierlistTemplate])

    

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={(theme) => ({
                    color: theme.palette.text.primary
                })}
            >
                Save {type.charAt(0).toUpperCase() + type.slice(1)}
            </DialogTitle>

            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                label="Name"
                fullWidth
                variant="outlined"
                margin="dense"
                value={type === "template" ? templateTitle : tierlistTitle}
                onChange={(e) =>
                    type === "template"
                    ? setTemplateTitle(e.target.value)
                    : setTierlistTitle(e.target.value)
                }
                sx={(theme) => ({
                    "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: theme.palette.secondary.main },
                    "&:hover fieldset": { borderColor: theme.palette.secondary.main },
                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                    },
                    "& .MuiInputLabel-root": { color: theme.palette.text.secondary },
                    "& .MuiInputBase-input": { color: theme.palette.text.primary },
                })}
                />

                <Select
                fullWidth
                value={isPrivate ? "private" : "public"}
                onChange={(e) =>
                    setIsPrivate(e.target.value.toLowerCase() === "private")
                }
                sx={(theme) => ({
                    color: theme.palette.text.primary,
                    "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.secondary.main,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.secondary.main,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.palette.primary.main,
                    },
                })}
                MenuProps={{
                    PaperProps: {
                    sx: (theme) => ({
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                    }),
                    },
                }}
                >
                <MenuItem value="public">{`Public`}</MenuItem>
                <MenuItem value="private">{`Private`}</MenuItem>
                </Select>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="secondary">
                Cancel
                </Button>
                <Button
                disabled={save}
                onClick={() => setSave(true)}
                variant="contained"
                color="primary"
                >
                Save
                </Button>
            </DialogActions>
        </Dialog>

    );
};

export default SavePrompt;

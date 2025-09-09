import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ModalButton {
  text: string;
  onClick: () => void;
}

interface CustomDialogProps {
  show: boolean;
  onHide: () => void;
  header: string | React.ReactNode;
  body: string | React.ReactNode;
  buttons: ModalButton[];
  showCancel?: boolean;
  staticBackdrop?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  show,
  onHide,
  header,
  body,
  buttons,
  showCancel = true,
  staticBackdrop = true,
}) => {
  const handleCancel = () => {
    onHide(); 
  };

  const handleClose = (_event: object, reason: string) => {
    if (staticBackdrop && reason === 'backdropClick') {
      return; // Prevent closing when clicking the backdrop
    }
    onHide(); // Close the modal otherwise
  };

  return (
    <Dialog
      open={show}
      onClose={handleClose}
    >
      <DialogTitle color="secondary">{header}</DialogTitle>
      <DialogContent>
        {typeof body === 'string' ? <Typography color="secondary">{body}</Typography> : body}
      </DialogContent>
      <DialogActions>
        {buttons.map((button, index) => (
          <Button key={index} variant="contained" onClick={button.onClick}>
            {button.text}
          </Button>
        ))}
        {showCancel && (
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;

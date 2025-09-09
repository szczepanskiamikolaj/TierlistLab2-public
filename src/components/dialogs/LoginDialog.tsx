import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import LoginButton from '../LoginButton';
import { eventBus } from '@/lib/eventBus'; 

interface CustomDialogProps {
  show: boolean;
  onHide: () => void;
  header: string | React.ReactNode;
  body: string | React.ReactNode;
  showCancel?: boolean;
  staticBackdrop?: boolean;
}

const LoginDialog: React.FC<CustomDialogProps> = ({
  show,
  onHide,
  header,
  body,
  showCancel = true,
  staticBackdrop = true,
}) => {
  const handleCancel = () => {
    onHide();
  };

  const handleClose = (_event: object, reason: string) => {
    if (staticBackdrop && reason === 'backdropClick') {
      return;
    }
    onHide();
  };

  useEffect(() => {
    const onLoginSuccess = () => {
      onHide(); // Close dialog on login success
    };

    eventBus.on('loginSuccess', onLoginSuccess);

    return () => {
      eventBus.off('loginSuccess', onLoginSuccess); // Clean up listener
    };
  }, [onHide]);

  return (
    <Dialog open={show} onClose={handleClose}>
      <DialogTitle>{header}</DialogTitle>
      <DialogContent>
        {typeof body === 'string' ? <Typography>{body}</Typography> : body}
      </DialogContent>
      <DialogActions>
        <LoginButton />
        {showCancel && (
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;

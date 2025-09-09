"use client";

import React, { useEffect, useState, ReactNode } from 'react';
import CustomDialog from './dialogs/CustomDialog';
import LoginDialog from './dialogs/LoginDialog';
import { eventBus } from '@/lib/eventBus';

interface ModalButton {
  text: string;
  onClick: () => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customDialogHeader, setCustomDialogHeader] = useState<string | React.ReactNode>('');
    const [customDialogBody, setCustomDialogBody] = useState<string | React.ReactNode>('');
    const [customDialogButtons, setCustomDialogButtons] = useState<ModalButton[]>([]);
    const [customDialogShowCancel, setCustomDialogShowCancel] = useState<boolean>(true);

    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [loginDialogHeader, setLoginDialogHeader] = useState<string | React.ReactNode>(''); 
    const [loginDialogBody, setLoginDialogBody] = useState<string | React.ReactNode>('');

    useEffect(() => {
        const openCustomDialog = (config: { header: React.ReactNode; body: React.ReactNode; buttons: ModalButton[]; showCancel?: boolean }) => {
            setCustomDialogHeader(config.header);
            setCustomDialogBody(config.body);
            setCustomDialogButtons(config.buttons);
            setCustomDialogOpen(true);
            setCustomDialogShowCancel(config.showCancel ?? true);
        };

        const closeCustomDialog = () => setCustomDialogOpen(false);

        const openLoginDialog = (config: { header: React.ReactNode; body: React.ReactNode }) => {
            setLoginDialogHeader(config.header);
            setLoginDialogBody(config.body);
            setLoginDialogOpen(true);
        };

        const closeLoginDialog = () => setLoginDialogOpen(false);

        // Register events
        eventBus.on('openCustomDialog', openCustomDialog);
        eventBus.on('closeCustomDialog', closeCustomDialog);
        eventBus.on('openLoginDialog', openLoginDialog);
        eventBus.on('closeLoginDialog', closeLoginDialog);

        // Clean up listeners on unmount
        return () => {
            eventBus.off('openCustomDialog', openCustomDialog);
            eventBus.off('closeCustomDialog', closeCustomDialog);
            eventBus.off('openLoginDialog', openLoginDialog);
            eventBus.off('closeLoginDialog', closeLoginDialog);
        };
    }, []);

    return (
        <>
            {children}

            <CustomDialog
                show={customDialogOpen}
                onHide={() => eventBus.emit('closeCustomDialog')}
                header={customDialogHeader}
                body={customDialogBody}
                buttons={customDialogButtons}
                showCancel={customDialogShowCancel}
            />

            <LoginDialog
                show={loginDialogOpen}
                onHide={() => eventBus.emit('closeLoginDialog')}
                header={loginDialogHeader}
                body={loginDialogBody}
            />
        </>
    );
};

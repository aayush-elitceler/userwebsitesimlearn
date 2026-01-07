'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ScreenRecordingContextType {
    stream: MediaStream | null;
    setStream: (stream: MediaStream | null) => void;
}

const ScreenRecordingContext = createContext<ScreenRecordingContextType | undefined>(undefined);

export function ScreenRecordingProvider({ children }: { children: ReactNode }) {
    const [stream, setStream] = useState<MediaStream | null>(null);

    // If the stream tracks end (user stops sharing via browser UI), clear the state
    useEffect(() => {
        if (stream) {
            const handleTrackEnded = () => {
                setStream(null);
            };

            stream.getTracks().forEach(track => {
                track.addEventListener('ended', handleTrackEnded);
            });

            return () => {
                stream.getTracks().forEach(track => {
                    track.removeEventListener('ended', handleTrackEnded);
                });
            };
        }
    }, [stream]);

    return (
        <ScreenRecordingContext.Provider value={{ stream, setStream }}>
            {children}
        </ScreenRecordingContext.Provider>
    );
}

export function useScreenRecordingContext() {
    const context = useContext(ScreenRecordingContext);
    if (context === undefined) {
        throw new Error('useScreenRecordingContext must be used within a ScreenRecordingProvider');
    }
    return context;
}

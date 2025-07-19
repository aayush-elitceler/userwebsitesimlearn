"use client"
import { useState, useEffect, useCallback } from 'react';

// Custom hook useCountdown for managing countdown logic
export const useCountdown = (initialCountdown: number) => {
    const [countdown, setCountdown] = useState<number>(initialCountdown); // State for countdown value
    const [resendDisabled, setResendDisabled] = useState<boolean>(true); // State to manage resend button state

    useEffect(() => {
        // Effect to handle countdown logic
        if (resendDisabled && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prevCountdown => prevCountdown - 1); // Decrement countdown every second
            }, 1000);
            return () => clearTimeout(timer); // Cleanup function to clear timeout
        } else if (countdown === 0) {
            setResendDisabled(false); // Enable resend button when countdown reaches 0
        }
    }, [resendDisabled, countdown]); // Dependencies for useEffect

    // Callback to reset countdown to initial state
    const resetCountdown = useCallback(() => {
        setResendDisabled(true); // Disable resend button
        setCountdown(initialCountdown); // Reset countdown to initial value
    }, [initialCountdown]); // Dependency for useCallback

    // Return countdown value, resend button state, and reset function
    return { countdown, resendDisabled, resetCountdown };
};

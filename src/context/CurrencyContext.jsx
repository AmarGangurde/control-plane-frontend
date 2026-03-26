import { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext();

// 1 USD = INR_RATE INR (display-only conversion, backend stays in paisa/INR)
const INR_RATE = 85;

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState(
        () => localStorage.getItem('wrexer_currency') || 'INR'
    );

    const toggleCurrency = useCallback(() => {
        setCurrency(prev => {
            const next = prev === 'INR' ? 'USD' : 'INR';
            localStorage.setItem('wrexer_currency', next);
            return next;
        });
    }, []);

    /**
     * fmt(inrValue, decimals?)
     * inrValue: already-converted INR rupees (NOT paisa)
     * Returns formatted string like "₹149" or "$1.75"
     */
    const fmt = useCallback((inrValue, decimals) => {
        if (currency === 'USD') {
            const usd = inrValue / INR_RATE;
            const d = decimals !== undefined ? decimals : (usd < 1 ? 4 : 2);
            return `$${usd.toFixed(d)}`;
        }
        // INR
        const d = decimals !== undefined ? decimals : (inrValue < 1 ? 4 : (Number.isInteger(inrValue) ? 0 : 2));
        return `₹${inrValue.toFixed(d)}`;
    }, [currency]);

    return (
        <CurrencyContext.Provider value={{ currency, toggleCurrency, fmt }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);

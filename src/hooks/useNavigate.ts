import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

const useNavigateWithQuery = () => {
    const navigate = useNavigate();
    return useCallback((to: string | number, options = {}) => {
        if (typeof to === 'number') {
            navigate(to);
            return;
        }
        const search = window.location.search;
        navigate(`${to}${search}`, options);
    }, [navigate]);
};

export const useNavigatePlain = () => {
    const navigate = useNavigate();
    return useCallback((to: string | number, options = {}) => {
        navigate(to as string, options);
    }, [navigate]);
};

export const useLocationState = <T>(): T | null => {
    const { state } = useLocation();
    return (state ?? null) as T | null;
};

export default useNavigateWithQuery;


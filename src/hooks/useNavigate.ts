import { useNavigate } from 'react-router-dom';
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

export default useNavigateWithQuery;


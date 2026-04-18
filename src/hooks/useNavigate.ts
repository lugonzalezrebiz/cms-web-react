import { useNavigate } from 'react-router-dom';

const useNavigateWithQuery = () => {
    const navigate = useNavigate();
    return (to: string | number, options = {}) => {
        if (typeof to === 'number') {
            navigate(to);
            return;
        }
        const search = window.location.search;
        navigate(`${to}${search}`, options);
    };
};

export default useNavigateWithQuery;


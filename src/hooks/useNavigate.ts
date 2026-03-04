
import { useNavigate } from 'react-router-dom';
const useNavigateWithQuery = () => {

    const navigate = useNavigate();
    return (to: string, options = {}) => {
        const search = window.location.search;
        navigate(`${to}${search}`, options);
    };
}

export default useNavigateWithQuery

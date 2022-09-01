import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
const Protected = ({children}) => {
    const {user} =React.useContext(AuthContext)
    if(!user){
        return(<Navigate to="/signin"/>)
    }
    return children
};

export default Protected;
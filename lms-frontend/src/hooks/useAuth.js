import { useContext } from 'react';
import { AuthContext, useAuth } from '../context/AuthContext';

// Re-export the useAuth hook from context
// Re-export convenience hook so other files can import from '.../hooks/useAuth'
export { useAuth } from './AuthContext';

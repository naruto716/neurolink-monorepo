import { store } from '@neurolink/shared';
import { injectReducers } from './injectableStore';

export const initStore = () => {
  // Add our reducers to the store
  injectReducers();
  
  return store;
}; 
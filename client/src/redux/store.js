import { configureStore } from '@reduxjs/toolkit';
import matchReducer from './slices/matchSlice';
import authReducer from './slices/authSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    match: matchReducer,
    auth: authReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

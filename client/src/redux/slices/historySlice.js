import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchHistory = createAsyncThunk('history/fetch', async (params = {}) => {
  const { data } = await api.get('/matches/history', { params });
  return data;
});

export const deleteMatch = createAsyncThunk('history/delete', async (id) => {
  await api.delete(`/matches/${id}`);
  return id;
});

const historySlice = createSlice({
  name: 'history',
  initialState: { matches: [], total: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (s) => { s.loading = true; })
      .addCase(fetchHistory.fulfilled, (s, a) => {
        s.loading = false;
        s.matches = a.payload.matches;
        s.total = a.payload.total;
      })
      .addCase(fetchHistory.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(deleteMatch.fulfilled, (s, a) => {
        s.matches = s.matches.filter((m) => m._id !== a.payload);
      });
  },
});

export default historySlice.reducer;

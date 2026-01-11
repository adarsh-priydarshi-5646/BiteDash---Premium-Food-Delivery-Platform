/**
 * Owner Redux Slice - Restaurant owner's shop data state management
 */
import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
  name: "owner",
  initialState: {
    myShopData: null,
  },
  reducers: {
    setMyShopData: (state, action) => {
      state.myShopData = action.payload;
    },
  },
});

export const { setMyShopData } = ownerSlice.actions;
export default ownerSlice.reducer;

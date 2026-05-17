import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: JSON.parse(localStorage.getItem('cartItems')) || [],
  appliedCoupon: JSON.parse(localStorage.getItem('appliedCoupon')) || null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, qty, options, variantPrice } = action.payload;
      const existingItem = state.items.find(
        (item) =>
          item.productId === product._id &&
          JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingItem) {
        existingItem.qty += qty;
      } else {
        state.items.push({
          productId: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          offerPrice: product.offerPrice,
          variantPrice: variantPrice,
          qty,
          options,
          stock: product.stock, // Store initial stock for quick reference
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    updateCartQty: (state, action) => {
      const { productId, qty } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.qty = qty;
      }
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      localStorage.removeItem('cartItems');
      localStorage.removeItem('appliedCoupon');
    },
    setCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
      localStorage.setItem('appliedCoupon', JSON.stringify(action.payload));
    },
    // Realtime stock sync for cart
    syncCartStock: (state, action) => {
      const { productId, newStock, variantUpdate } = action.payload;
      state.items = state.items.map(item => {
        if (item.productId === productId) {
          if (variantUpdate && item.options?.flavor === variantUpdate.flavor && item.options?.weight === variantUpdate.weight) {
             return { ...item, stock: variantUpdate.newVariantStock };
          } else if (!variantUpdate) {
             return { ...item, stock: newStock };
          }
        }
        return item;
      });
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    }
  },
});

export const { addToCart, removeFromCart, updateCartQty, clearCart, setCoupon, syncCartStock } = cartSlice.actions;
export default cartSlice.reducer;

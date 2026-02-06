export const kurlyElements = {
  header: {
    searchBar: 'input[placeholder*="검색"]',
    myPageIcon: 'a[href="/mypage"]',
  },

  login: {
    idInput: 'input[name="id"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"]',
  },

  product: {
    productCard: 'a[href*="/goods/"]',
  },

  cart: {
    cartItem: '[class*="cart"][class*="item"]',
  },
};
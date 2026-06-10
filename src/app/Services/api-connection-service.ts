import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { registerInterface } from '../Interfaces/register-interface';
import { VerifyUserInterface } from '../Interfaces/verify-user-interface';
import { LogInInterface } from '../Interfaces/log-in-interface';
import { ApiResponseInterface } from '../Interfaces/api-response-interface';
import { addCategoryInterface } from '../Interfaces/add-category-interface';
import { UpdateBrandInterface } from '../Interfaces/update-brand-interface';
import { UpdateUserInterface } from '../Interfaces/update-user-interface';
import { AddShippingAddressInterface } from '../Interfaces/add-shipping-address-interface';

@Injectable({
  providedIn: 'root',
})
export class ApiConnectionService {
  getMobilesOnly() {
    throw new Error('Method not implemented.');
  }
  private readonly _httpClient = inject(HttpClient);

  // Auth

  registerUser(userRequest: registerInterface) {
    return this._httpClient.post('https://localhost:7226/api/Auth/register', userRequest);
  }

  verifyUser(verificationData : VerifyUserInterface) {
    return this._httpClient.post('https://localhost:7226/api/Auth/verify-email', verificationData);
  }

  logInUser(logInData: LogInInterface) {
    return this._httpClient.post<ApiResponseInterface<any>>(`https://localhost:7226/api/Auth/login`, logInData);
  }

  // User

  getUserInfo(userId: string) {
    return this._httpClient.get<ApiResponseInterface<any>>(`https://localhost:7226/api/User/get-user-by-id/${userId}`);
  }

  getAllUsers() {
    return this._httpClient.get<ApiResponseInterface<any>>('https://localhost:7226/api/User/get-all-users');
  }

  getUserById(userId: number) {
    return this._httpClient.get<ApiResponseInterface<any>>(`https://localhost:7226/api/User/get-user-by-id/${userId}`);
  }

  updateUser(userId: number, userData: UpdateUserInterface) {
    return this._httpClient.put<ApiResponseInterface<any>>(`https://localhost:7226/api/User/update-user/${userId}`, userData);
  }

  deleteUser(userId: number) {
    return this._httpClient.delete<ApiResponseInterface<any>>(`https://localhost:7226/api/User/delete-user/${userId}`);
  }

  depositFunds(userId: number, amount: number) {
    return this._httpClient.put<ApiResponseInterface<any>>(`https://localhost:7226/api/User/deposit-user-balance/${userId}?amount=${amount}`, null);
  }

  // Category
  getAllCategories() {
    return this._httpClient.get<ApiResponseInterface<any>>('https://localhost:7226/api/Category/get-all-categories');
  }

  addCategory(categoryData : addCategoryInterface) {
    return this._httpClient.post('https://localhost:7226/api/Category/create-category', categoryData);
  }

  editCategory(categoryId: number, categoryEditData: addCategoryInterface) {
    return this._httpClient.put(
      `https://localhost:7226/api/Category/update-category/${categoryId}`,
      categoryEditData
    );
  }

  deleteCategory(categoryId : number){
    return this._httpClient.delete(`https://localhost:7226/api/Category/delete-category/${categoryId}`)
  }

  // Brand
 getAllBrands() {
    return this._httpClient.get<ApiResponseInterface<any[]>>('https://localhost:7226/api/Brand/get-all-brands');
  }

  addBrand(brandData: { name: string }) {
    return this._httpClient.post<ApiResponseInterface<string>>("https://localhost:7226/api/Brand/create-brand", brandData);
  }

  editBrand(brandId: number, brandEditData: UpdateBrandInterface) {
    brandEditData.id = brandId; 
    return this._httpClient.put<ApiResponseInterface<string>>(`https://localhost:7226/api/Brand/${brandId}`, brandEditData);
  }

  deleteBrand(brandId: number) {
    return this._httpClient.delete<ApiResponseInterface<string>>(`https://localhost:7226/api/Brand/${brandId}`);
  }

  // product
  getAllProducts(filters?: {
    search?: string;
    categoryId?: number;
    brandId?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    minRating?: number;
    sortBy?: number;
    page?: number;
    pageSize?: number;
  }) {
    let params = new HttpParams();

    // Dynamically append parameters if they exist
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this._httpClient.get("https://localhost:7226/api/Product/get-all-products", { params });
  }
  getProductByCategory(categoryId: number){
    return this._httpClient.get(`https://localhost:7226/api/Product/get-product-by-category/${categoryId}`)
  }

  addProduct(productData: any) {
    return this._httpClient.post('https://localhost:7226/api/Product/create-product', productData);
  }

 editProduct(productId: number, productEditData: any) {
    return this._httpClient.put(
      `https://localhost:7226/api/Product/update-product/${productId}`,
      productEditData
    );
  }

  addReview(productId: number, comment: string, rating: number) {
    return this._httpClient.post<ApiResponseInterface<any>>(
      `https://localhost:7226/api/Product/${productId}/reviews`,
      { comment, rating }
    );
  }

  deleteReview(productId: number, reviewId: number) {
    return this._httpClient.delete<ApiResponseInterface<any>>(
      `https://localhost:7226/api/Product/${productId}/reviews/${reviewId}`
    );
  }
  deleteProduct(productId : number){
    return this._httpClient.delete(`https://localhost:7226/api/Product/delete-product/${productId}`)
  }

  // Orders

  getAllOrders(){
    return this._httpClient.get("https://localhost:7226/api/Order/get-all-orders?page=1&pageSize=50")
  }

  getOrdersByStatus(statusId : number){
    return this._httpClient.get(`https://localhost:7226/api/Order/get-order-by-status/${statusId}`)
  }

  // orders status managment
  // თუ backend-ზე "OrderManagment" წერია (typo-თი)
  markOrderAsPaid(id: number) {
    return this._httpClient.patch(`https://localhost:7226/api/OrderManagment/${id}/pay`, {});
  }
  markOrderAsShipped(id: number) {
    return this._httpClient.patch(`https://localhost:7226/api/OrderManagment/${id}/ship`, {});
  }
  markOrderAsDelivered(id: number) {
    return this._httpClient.patch(`https://localhost:7226/api/OrderManagment/${id}/deliver`, {});
  }
  cancelOrder(id: number) {
    return this._httpClient.patch(`https://localhost:7226/api/OrderManagment/${id}/cancel`, {});
  }

  // Cart

  getCart(userId: number) {
    return this._httpClient.get<ApiResponseInterface<any>>(`https://localhost:7226/api/Cart/${userId}`);
  }

  addToCart(userId: number, productId: number, quantity: number = 1) {
    return this._httpClient.post<ApiResponseInterface<any>>('https://localhost:7226/api/Cart/add',
      { userId, productId, quantity }
    );
  }

  updateCartItem(userId : number, cartItemId: number, quantity: number) {
    return this._httpClient.put<ApiResponseInterface<any>>('https://localhost:7226/api/Cart/item', { userId, cartItemId, quantity });
  }

  removeFromCart(userId: number, cartItemId: number) {
    return this._httpClient.delete<ApiResponseInterface<any>>(`https://localhost:7226/api/Cart/${userId}/item/${cartItemId}`);
  }

  clearCart(userId: number) {
    return this._httpClient.delete<ApiResponseInterface<any>>(`https://localhost:7226/api/Cart/${userId}/clear`);
  }

  checkoutCart(userId: number, shippingAddressId: number, paymentMethod: number) {
    return this._httpClient.post<ApiResponseInterface<any>>(
      `https://localhost:7226/api/Order/checkout`,
      { userId, shippingAddressId, paymentMethod },
    );
  }

  // shipping address

  getShippingAddresses(userId: number) {
    return this._httpClient.get<any>(
      `https://localhost:7226/api/ShippingAddress/user/${userId}`
    );
  }

  addShippingAddress(addShippingAddressData : AddShippingAddressInterface){
    return this._httpClient.post("https://localhost:7226/api/ShippingAddress", addShippingAddressData)
  }

  deleteShippingAddress(addressId : number, userId : number){
    return this._httpClient.delete(`https://localhost:7226/api/ShippingAddress/${addressId}?userId=${userId}`)
  }
  
  // analytics 
  getAnalytics(){
    return this._httpClient.get("https://localhost:7226/api/Analytics")
  }

  // Product Details
  getProductById(productId: number) {
    return this._httpClient.get<ApiResponseInterface<any>>(`https://localhost:7226/api/Product/get-product-by-id/${productId}`);
  }
}

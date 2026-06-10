import { Routes } from '@angular/router';
import { userDataResolver } from './Resolvers/user-data-resolver'; 
import { brandsAndCategoriesResolver } from './Resolvers/brands-and-categories-resolver';
import { categoriesResolver } from './Resolvers/categories-resolver';
import { brandsResolver } from './Resolvers/brands-resolver';
import { usersResolver } from './Resolvers/users-resolver';
import { roleGuard } from './Gurads/role-guard-guard';

export const routes: Routes = [
    {
      "path": "", 
      "loadComponent": () => import("./Pages/home-page/home-page").then(m => m.HomePage),
      canActivate: [roleGuard],
      data: { roles: ['User', 'Manager', "Guest"] }
    },
    {
      "path": "register", 
      "loadComponent": () => import("./Pages/register-page/register-page").then(m => m.RegisterPage),
      canActivate: [roleGuard],
      data: { roles: ["Guest"] }
    },
    {
      "path": "user/:userId", 
      "loadComponent": () => import("./Pages/user-page/user-page").then(m => m.UserPage), 
      "resolve": { userData: userDataResolver },
      canActivate: [roleGuard],
      data: { roles: ['User', 'Manager', "Guest", "Admin"] } 
    },
    {
      "path": "add-category", 
      "loadComponent": () => import("./Pages/add-category-page/add-category-page").then(m => m.AddCategoryPage),
      "resolve" : {categories : categoriesResolver},
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path": "add-brand",
      "loadComponent": () => import("./Pages/add-brands-page/add-brands-page").then(m => m.AddBrandsPage),
      "resolve" : {brands : brandsResolver},
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path": "add-product", 
      "loadComponent": () => import("./Pages/add-product-page/add-product-page").then(m => m.AddProductPage),
      "resolve": {brandsAndCategories: brandsAndCategoriesResolver},
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path": "manage-users", 
      "loadComponent": () => import("./Pages/manage-users-page/manage-users-page").then(m => m.ManageUsersPage),
      "resolve" : {users : usersResolver},
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path": "user-details/:id",
      "loadComponent": () => import("./Pages/view-user-details-page/view-user-details-page").then(m => m.ViewUserDetailsPage),
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path" : "shipping-addresses",
      "loadComponent" : () => import("./Pages/add-shipping-address-page/add-shipping-address-page").then(m => m.AddShippingAddressPage)
    },
    {
      "path" : "manage-orders",
      "loadComponent" : () => import("./Pages/manage-orders-page/manage-orders-page").then(m => m.ManageOrdersPage),
      canActivate: [roleGuard],
      data: { roles: ['Admin'] }
    },
    {
      "path" : "analytics",
      loadComponent : () => import("./Pages/analytics-page/analytics-page").then(m => m.AnalyticsPage)
    },
    {
      "path": "product/:productId",
      "loadComponent": () => import("./Pages/product-details-page/product-details-page").then(m => m.ProductDetailsPage),
      canActivate: [roleGuard],
      data: { roles: ['User', 'Manager', 'Guest', 'Admin'] }
    },
    {
      "path" : "my-orders/:userId",
      "loadComponent" : () => import("./Pages/my-orders-page/my-orders-page").then(m => m.MyOrdersPage)
    },
    {
      "path" : "shop-page",
      "loadComponent" : () => import("./Pages/shop-page/shop-page").then(m => m.shopPage)
    }
];
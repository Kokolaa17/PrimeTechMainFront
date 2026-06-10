export interface UserInfoInterface {
    id: number;
  name: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  balance: number;
  totalSpent: number;
  purchaseCount: number;
  purchasesBeforeDiscount: number;
  isVerified: boolean;
  emailVerificationCode: string | null;
  passwordResetCode: string | null;
  role: number; 
  orders: any[]; 
  cart: any | null; 
}

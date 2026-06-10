export interface ProductDetailsInterface {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  warrantyMonths: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  images: string[];
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewInterface {
  id?: number;
  productId: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
  helpfulCount?: number;
  isHelpful?: boolean;
}

export interface AddReviewInterface {
  productId: number;
  userId: number;
  rating: number;
  title: string;
  comment: string;
}

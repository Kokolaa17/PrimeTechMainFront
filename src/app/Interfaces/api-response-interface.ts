export interface ApiResponseInterface<T = any> {
    success: boolean;
    message: string;
    data: T;
}

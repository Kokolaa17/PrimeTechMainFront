export interface UpdateCategoryInterface {
    id : number;
    name : string;
    image : string;
    parentCategoryId? : number | null;
}

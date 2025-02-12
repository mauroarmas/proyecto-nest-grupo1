import { PaginationArgs } from "./pagination.dto";

export function getPaginationFilter (pagination: PaginationArgs){
    const {page, perPage} = pagination;
    return {
        take: perPage,
        skip: (page - 1) * perPage
    }
}
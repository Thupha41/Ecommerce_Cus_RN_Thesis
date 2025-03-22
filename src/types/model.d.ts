export { };

declare global {
    interface IBackendRes<T> {
        error?: string | string[];
        message: string | string[];
        statusCode: number | string;
        result?: T;
    }

    interface IModelPaginate<T> {
        meta: {
            current: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        results: T[]
    }

    interface IRegister {
        _id: string;
        access_token: string;
    }

    interface IUserLogin {
        user: {
            email: string;
            _id: string;
            name: string;
            role: string;
            address: any;
            avatar: string;
            phone: string;
        };
        access_token: string;
    }

    interface ITopRestaurant {
        _id: string;
        name: string;
        phone: string;
        address: string;
        email: string;
        rating: number;
        image: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }

    interface ITopProducts {
        _id: string;
        product_name: string;
        product_thumb: string;
        product_price: number;
    }

    interface IRestaurant {
        _id: string;
        name: string;
        phone: string;
        address: string;
        email: string;
        rating: number;
        image: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;

        menu: IMenu[];
        isLike: boolean;
    }

    interface IProductDetail {
        _id: string;
        product_name: string;
        product_thumb: string;
        product_price: number;
        product_quantity: number;
        product_type: string;
        product_description: string;
        product_ratingsAverage: number;
        product_shop: string;
        created_at: Date;
        updated_at: Date;
        isPublished: boolean;
        isDraft: boolean;
        product_slug: string;
        product_attributes: IProductAttribute;
    }

    interface IProductAttribute {
        brand?: string;
        size?: string;
        color?: string;
        material?: string;
        style?: string;
        author?: string;
        manufacturer?: string;
        model?: string;
        year_published?: number;
        publisher?: string;
    }

    interface IMenu {
        _id: string;
        restaurant: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        menuItem: IMenuItem[]
    }

    interface IMenuItem {
        _id: string;
        menu: string;
        title: string;
        description: string;
        basePrice: number,
        image: string;
        options: {
            title: string;
            description: string;
            additionalPrice: number;
        }[],
        createdAt: Date;
        updatedAt: Date;
    }

    interface ICart {
        [key: string]: {
            sum: number;
            quantity: number;
            items: {
                [key: string]: {
                    quantity: number;
                    data: IMenuItem;
                    extra?: {
                        [key: string]: number;
                    }
                }
            }
        }
    }

    // cart: {
    //     "id-cua-hang-1": {
    //         sum: 123,
    //         quantity: 10,
    //         items: {
    //             "san-pham-1": {
    //                 quantity: 2,
    //                 data: {},
    //                 extra: {
    //                    "size L":  1,
    //                    "size M":  1
    //                 }
    //             }
    //         }
    //     }
    // }

    interface IOrderHistory {
        _id: string;
        restaurant: IRestaurant;
        user: string;
        status: string;
        totalPrice: number;
        totalQuantity: number;
        orderTime: Date;
        detail: {
            image: string;
            title: string;
            option: string;
            price: number;
            quantity: number;
        }[]
        createdAt: Date;
        updatedAt: Date;
    }

    interface IAddToCart {
        product: {
            product_id: string,
            shopId: string,
            product_quantity: number,
            name: string,
            product_price: number
        }
    }

    interface ICartResponse {
        _id: string;
        cart_status: string;
        cart_userId: string;
        cart_count_product: number;
        cart_total_price: number;
        cart_products: ICartItem[];
    }

    interface ICartItem {
        product_id: string;
        shopId: string;
        product_quantity: number;
        name: string;
        product_price: number;
    }
}

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
        cart: {
            _id: string;
            cart_status: string;
            cart_userId: string;
            cart_count_product: number;
            cart_total_price: number;
            cart_products: ICartItem[];
        }
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
        product_media: Array<{
            url: string;
            type: string;
        }>;
        product_price: number;
        product_quantity: number;
        product_category: string;
        product_description: string;
        product_ratingsAverage: number;
        product_shop: string;
        isPublished: boolean;
        isDraft: boolean;
        isDeleted: boolean;
        product_slug: string;
        spu_no?: string;
        shop: {
            _id: string;
            shop_name: string;
            shop_logo: string;
            shop_rating: number;
            shop_response_rate: number;
            total_products: number;
        };
        product_variations?: Array<{
            name: string;
            options: string[];
        }>;
        product_skus: Array<{
            _id: string;
            sku_tier_idx: number[];
            sku_price: number;
            sku_stock: number;
            sku_image: string;
            product_id: string;
            sku_no: string;
        }>;
        other_shop_products: Array<{
            _id: string;
            product_name: string;
            product_thumb: string;
            product_price: string | number;
            sold_quantity?: number;
        }>;
        product_attributes: Array<{
            name: string;
            value: string;
        }>;
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

    // interface ICart {
    //     [key: string]: {
    //         sum: number;
    //         quantity: number;
    //         items: {
    //             [key: string]: {
    //                 quantity: number;
    //                 data: IMenuItem;
    //                 extra?: {
    //                     [key: string]: number;
    //                 }
    //             }
    //         }
    //     }
    // }

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
        order_userId: string;
        order_trackingNumber: string;
        order_products: Array<{
            shopId: string;
            priceRaw: number;
            priceApplyDiscount: number;
            shop_discounts: string[];
            item_products: Array<{
                product_thumb: string;
                name: string;
                productId: string;
                quantity: number;
                price: number;
                sku_id?: string;
                variants?: Array<{
                    name: string;
                    value: string;
                }>
            }>
        }>
        order_status: string;
    }

    interface IAddToCart {

            product_id: string,
            shopId: string,
            product_quantity: number,
            name: string,
            product_price: number,
            sku_id?: string
        
    }

    interface IUpdateCart {
        product_id: string,
        shopId: string,
        product_quantity: number,
        name: string,
        product_price: number,
        sku_id?: string,
        old_quantity?: number,
        new_sku_id?: string,
        product_options?: string
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
        product_thumb: string;
        variants?: [
            {
                name: string;
                value: string;
            }
        ],
        sku_id?: string;
        product_options?: string;
    }

    interface ICategory {
        _id: string;
        category_name: string;
        image: string;
        level: number;
    }

    interface IShop {
        _id: string;
        shop_owner: string;
        shop_name: string;
        shop_description: string;
        shop_slug: string;
        shop_status: string;
        created_at: Date;
        updated_at: Date;
        shop_response_rate: number;
        shop_hotline_phone: string;
        shop_email: string;
        shop_logo: string;
        shop_banner: string;
        shop_revenue: number;
        follower_count: number;
        is_followed: boolean;
        shop_rating: number;
    }

    interface IDeliveryAddress {
        _id: string;
        personal_detail: {
            name: string;
            phone: string;
        },
        shipping_address: {
            province_city: string;
            district: string;
            ward: string;
            street: string;
        },
        is_default: boolean
    }


    interface ICheckoutOrderRequest {
        cartId: string;
        shop_order_ids: Array<{
            shopId: string;
            shop_discounts: string[];
            item_products: Array<{
                productId: string;
                quantity: number;
                price: number;
                sku_id?: string;
            }>
        }>
    }

    interface ICheckoutOrder {
        shop_order_ids: Array<{
            shopId: string;
            shop_discounts: string[];
            item_products: Array<{
                productId: string;
                quantity: number;
                price: number;
                sku_id?: string;
                variants?: Array<{
                    name: string;
                    value: string;
                }>
            }>
        }>;
        shop_order_ids_new: Array<{
            shopId: string;
            shop_discounts: string[];
            priceRaw: number;
            priceApplyDiscount: number;
            item_products: Array<{
                productId: string;
                quantity: number;
                price: number;
                sku_id?: string;
                variants?: Array<{
                    name: string;
                    value: string;
                }>
            }>
        }>;
        checkout_order: {
            totalPrice: number;
            feeShip: number;
            totalDiscount: number;
            totalCheckout: number
        }
    }

    interface IOrderRequest {
        cartId: string;
        shop_order_ids: Array<{
            product_id: string;
            item_products: Array<{
                productId: string;
                quantity: number;
                sku_id?: string;
                price: number;
            }>
            shop_discounts: string[];
        }>;
        delivery_info: {
            personal_detail: {
                name: string;
                phone: string;
            },
            shipping_address: {
                province_city: string;
                district: string;
                ward: string;
                street: string;
            },
            is_default: boolean
        },
        user_payment: string;
    }

    interface IOrder {
        _id: string;
        order_number: string;
        order_status: string;
        order_trackingNumber: string;
        order_userId: string;
        order_status: string;
        order_total: number;
        order_items_count: number;
        order_createdAt: string;
        order_updatedAt: string;
        order_payment: string;
        actions: {
            can_cancel: boolean;
            contact_shop: boolean;
            view_details: boolean;
        }
        order_products: Array<{
            shop_discounts: string[];
            priceRaw: number;
            priceApplyDiscount: number;
            item_products: Array<{  
                name: string;
                product_thumb: string;
                product_id: string;
                quantity: number;
                price: number;
                sku_id?: string;
                variants?: Array<{
                    name: string;
                    value: string;
                }>
            }>
        }>;
        order_shipping: {
            personal_detail: {
                name: string;
                phone: string;
            },
            shipping_address: {
                province_city: string;
                district: string;
                ward: string;
                street: string;
            },
            is_default: boolean
        }
        order_checkout: {
            totalPrice: number;
            feeShip: number;
            totalDiscount: number;
            totalCheckout: number
        }
    }

}

import axios1 from "@/utils/axios.customize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import axios from "axios";

export const registerAPI = (email: string, password: string, name: string, confirm_password: string) => {
    const url = `/api/v1/users/register`;
    return axios1.post<IBackendRes<IRegister>>(url, { email, password, name, confirm_password });
}

// export const registerAPI = (email: string, password: string, name: string, confirm_password: string) => {
//     const url = `/api/v1/users/register`;
//     return axios.post<IBackendRes<IRegister>>(url, { email, password, name, confirm_password });
// }

export const verifyCodeAPI = (email: string, code: string) => {
    const url = `/api/v1/users/verify-email`;
    return axios1.post<IBackendRes<IRegister>>(url, { email, code });
}

export const resendCodeAPI = (email: string) => {
    const url = `/api/v1/users/resend-verify-email`;
    return axios1.post<IBackendRes<IRegister>>(url, { email });
}

export const loginAPI = (email: string, password: string) => {
    const url = `/api/v1/users/login`;
    return axios1.post<IBackendRes<IUserLogin>>(url, { email, password });
}

export const getAccountAPI = () => {
    const url = `/api/v1/users/me`;
    return axios1.get<IBackendRes<IUserLogin>>(url);
}

export const chatWithAI = async (user_id: string, conversation_id: string, text: string) => {

        const url = 
             'https://clipchatalpha.ezgroups.com.vn/api/v1/agent/get_text_response/'
 
            
        const formData = new FormData();
        formData.append('conversation_id', conversation_id);
        formData.append('user_id', user_id);
        formData.append('text', text);


        const response = await axios1.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log('>>> check response', response)
        return response;
}

export const chatImageWithAI = async (user_id: string, conversation_id: string, text: string, imageUri: string) => {
    try {
        const url = 'https://clipchatalpha.ezgroups.com.vn/api/v1/agent/get_image_response/';

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('conversation_id', conversation_id);
        formData.append('user_id', user_id);
        formData.append('text', text);
        
        // Get filename from URI
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        // For React Native, we need to specify the URI, type and name
        const fileType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        // Log file info
        console.log('File details:', {
            uri: imageUri,
            name: fileName,
            type: fileType
        });
        
        // Create proper file object for React Native
        // This format is specific to React Native's FormData implementation
        const fileObject = {
            uri: imageUri,
            type: fileType,
            name: fileName,
        };
        
        formData.append('image', fileObject as any);
        
        console.log('Attempting to send image to:', url);
        
        // Use axios directly instead of our custom instance to avoid any middleware issues
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
        });
        
        console.log('>>> API response status:', response.status);
        console.log('>>> API response data:', JSON.stringify(response.data));
        
        // Check if we have a valid response and data
        if (!response || !response.data) {
            console.warn('API returned empty response');
            throw new Error('API returned empty response');
        }
        
        return response;
    } catch (error) {
        console.error('Error in chatImageWithAI:', error);
        console.error('Error details:', JSON.stringify(error));
        
        // Return a fallback response object that won't cause undefined errors
        return {
            data: {
                action: "error",
                status: "error",
                response: {
                    response: "Sorry, there was an error processing your image.",
                    products: []
                }
            }
        };
    }
}

export const getTopRestaurant = (ref: string) => {
    const url = `/api/v1/restaurants/${ref}`;
    return axios1.post<IBackendRes<ITopRestaurant[]>>(url, {}, {
        headers: {
            delay: 1500
        }
    });
}

export const getTopProducts = (ref: string) => {
    const url = `/api/v1/products/${ref}`;
    return axios1.get<IBackendRes<ITopProducts[]>>(url);
}

export const printAsyncStorage = () => {
    AsyncStorage.getAllKeys((err, keys) => {
        AsyncStorage.multiGet(keys!, (error, stores) => {
            let asyncStorage: any = {}
            stores?.map((result, i, store) => {
                asyncStorage[store[i][0]] = store[i][1]
            });
            console.log(JSON.stringify(asyncStorage, null, 2));
        });
    });
};

export const getURLBaseBackend = () => {
    const backend = Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_ANDROID_API_URL
        : process.env.EXPO_PUBLIC_IOS_API_URL;

    return backend;
}

export const getRestaurantByIdAPI = (id: string) => {
    const url = `/api/v1/restaurants/${id}`;
    return axios.get<IBackendRes<IRestaurant>>(url, {
        headers: { delay: 1500 }
    });
}

export const getProductByIdAPI = (id: string) => {
    const url = `/api/v1/products/${id}`;
    return axios1.get<IBackendRes<IProductDetail>>(url)
}

export const processDataRestaurantMenu = (restaurant: IRestaurant | null) => {
    if (!restaurant) return [];
    return restaurant?.menu?.map((menu, index) => {
        return {
            index,
            key: menu._id,
            title: menu.title,
            data: menu.menuItem
        }
    })
}

export const currencyFormatter = (value: any) => {
    const options = {
        significantDigits: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        symbol: 'đ'
    }

    if (typeof value !== 'number') value = 0.0
    value = value.toFixed(options.significantDigits)

    const [currency, decimal] = value.split('.')
    return `${currency.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        options.thousandsSeparator
    )} ${options.symbol}`
}


export const updateUserAPI = (_id: string, name: string, phone: string) => {
    const url = `/api/v1/users`;
    return axios.patch<IBackendRes<IUserLogin>>(url, { _id, name, phone });
}

export const updateUserPasswordAPI = (
    currentPassword: string,
    newPassword: string,
) => {
    const url = `/api/v1/users/password`;
    return axios.post<IBackendRes<IUserLogin>>(url, { currentPassword, newPassword });
}

export const requestPasswordAPI = (email: string) => {
    const url = `/api/v1/auth/retry-password`;
    return axios.post<IBackendRes<IUserLogin>>(url, { email });
}

export const forgotPasswordAPI = (code: string, email: string, password: string) => {
    const url = `/api/v1/auth/forgot-password`;
    return axios.post<IBackendRes<IUserLogin>>(url, { code, email, password });
}

export const likeRestaurantAPI = (restaurant: string, quantity: number) => {
    const url = `/api/v1/likes`;
    return axios.post<IBackendRes<IUserLogin>>(url, { restaurant, quantity });
}

export const getFavoriteRestaurantAPI = () => {
    const url = `/api/v1/likes?current=1&pageSize=10`;
    return axios.get<IBackendRes<IRestaurant[]>>(url);
}


export const getRestaurantByNameAPI = (name: string) => {
    const url = `/api/v1/restaurants?current=1&pageSize=10&name=/${name}/i`;
    return axios.get<IBackendRes<IModelPaginate<IRestaurant>>>(url);
}

export const filterRestaurantAPI = (query: string) => {
    const url = `/api/v1/restaurants?${query}`;
    return axios.get<IBackendRes<IModelPaginate<IRestaurant>>>(url);
}

// Get cart items for the current user
export const getCartItemsAPI = (userId: string) => {
    const url = `/api/v1/carts?userId=${userId}`;
    return axios1.get<IBackendRes<ICartResponse>>(url);
}

// Add product to cart
export const addProductToCartAPI = (product: IAddToCart) => {
    const url = `/api/v1/carts`;
    return axios1.post<IBackendRes<ICartResponse>>(url, { product });
}

// Update cart item quantity (increase)
export const updateCartAPI = (product: IUpdateCart) => {
    const url = `/api/v1/carts/update`;
    return axios1.put<IBackendRes<ICartResponse>>(url, { product });
}

// Delete cart item
export const deleteCartItemAPI = (productId: string, sku_id?: string) => {
    const url = `/api/v1/carts`;
    return axios1.delete<IBackendRes<ICartResponse>>(url, { 
        data: {
            productId,
            sku_id
        },
    });
}

export const deleteCartItemBySkuIdAPI = (productId: string, sku_id: string) => {
    const url = `/api/v1/carts`;
    return axios1.delete<IBackendRes<ICartResponse>>(url, { 
        data: {
            productId, sku_id
        },
    });
}


export const getCategoryByLevelAPI = (level: number) => {
    const url = `api/v1/categories/level/${level}`
    return axios1.get<IBackendRes<ICategory>>(url)
}

export const getChildrenCategoryByParentIDAPI = (parentId: string) => {
    const url = `api/v1/categories/children/${parentId}`
    return axios1.get<IBackendRes<ICategory>>(url)
}

export const getProductByCategoryIDAPI = (categoryId: string) => {
    const url = `api/v1/categories/${categoryId}/products`
    return axios1.get<IBackendRes<ITopProducts>>(url)
}


export const getShopByIDAPI = (shopId: string) => {
    const url = `api/v1/shops/${shopId}`
    return axios1.get<IBackendRes<IShop>>(url)
}

export const getAllProductsByShopIDAPI = (
    shopId: string, 
    sortBy: 'created_at' | 'sold_quantity' | 'price_asc' | 'price_desc' = 'created_at',
    page: number = 1,
    limit: number = 20
) => {
    const url = `api/v1/shops/${shopId}/products?sortBy=${sortBy}&page=${page}&limit=${limit}`
    return axios1.get<IBackendRes<{
        products: ITopProducts[],
        page: number,
        limit: number,
        total: number,
        totalPages: number
    }>>(url)
}

export const createDeliveryAddressAPI = (data: IDeliveryAddress) => {
    const url = `/api/v1/delivery-info`;
    return axios1.post<IBackendRes<IDeliveryAddress>>(url, { data });
}

export const getAllDeliveryAddressByUserIDAPI = (userId: string) => {
    const url = `/api/v1/delivery-info/${userId}`;
    return axios1.post<IBackendRes<IDeliveryAddress[]>>(url);
}

export const getDeliveryAddressByIDAPI = (deliveryAddressId: string) => {
    const url = `/api/v1/delivery-info/${deliveryAddressId}`;
    return axios1.get<IBackendRes<IDeliveryAddress>>(url);
}

export const updateDeliveryAddressAPI = (deliveryAddressId: string, data: IDeliveryAddress) => {
    const url = `/api/v1/delivery-info/${deliveryAddressId}`;
    return axios1.put<IBackendRes<IDeliveryAddress>>(url, { data });
}

export const deleteDeliveryAddressAPI = (deliveryAddressId: string) => {
    const url = `/api/v1/delivery-info/${deliveryAddressId}`;
    return axios1.delete<IBackendRes<IDeliveryAddress>>(url);
}

export const getDeliveryDefaultByUserAPI = () => {
    const url = `/api/v1/delivery-info/default`;
    return axios1.get<IBackendRes<IDeliveryAddress>>(url);
}

export const getAllDeliveriesAPI = () => {
    const url = `/api/v1/delivery-info`;
    return axios1.get<IBackendRes<IDeliveryAddress[]>>(url);
}

export const checkoutOrderAPI = (data: ICheckoutOrderRequest) => {
    const url = `api/v1/orders/checkout/checkout-review`
    return axios1.post<IBackendRes<ICheckoutOrder>>(url, data);
}



export const placeOrderAPI = (data: IOrderRequest) => {
    const url = `/api/v1/orders`;
    return axios1.post<IBackendRes<IOrder>>(url, data);
}

export const getOrderHistoryAPI = (status?: string) => {
    const url = status ? `/api/v1/orders?status=${status}` : `/api/v1/orders`;
    return axios1.get<IBackendRes<IOrderHistory[]>>(url);
}

export const getOrderDetailAPI = (orderId: string) => {
    const url = `/api/v1/orders/${orderId}`;
    return axios1.get<IBackendRes<IOrder>>(url);
}



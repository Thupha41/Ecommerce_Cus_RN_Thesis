import axios1 from "@/utils/axios.customize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import axios from "axios";

export const registerAPI = (email: string, password: string, name: string) => {
    const url = `/api/v1/users/register`;
    return axios1.post<IBackendRes<IRegister>>(url, { email, password, name });
}

// export const registerAPI = (email: string, password: string, name: string, confirm_password: string) => {
//     const url = `/api/v1/users/register`;
//     return axios.post<IBackendRes<IRegister>>(url, { email, password, name, confirm_password });
// }

export const verifyCodeAPI = (email: string, code: string) => {
    const url = `/api/v1/users/verify-code`;
    return axios1.post<IBackendRes<IRegister>>(url, { email, code });
}

export const resendCodeAPI = (email: string) => {
    const url = `/api/v1/users/verify-email`;
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
    try {
        const url = 
             'https://clipchattest.ezgroups.com.vn/api/v1/agent/get-response/'
 
            
        const formData = new FormData();
        formData.append('conversation_id', conversation_id);
        formData.append('user_id', user_id);
        formData.append('text', text);
        
        // if (image) {
        //     formData.append('image', image);
        // }

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response;
    } catch (error) {
        console.error('Chat API Error:', error);
        throw error;
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

export const getProductByNameAPI = (name: string) => {
    // Đảm bảo tên sản phẩm đã được mã hóa URI
    const encodedName = encodeURIComponent(name);
    let url = `/api/v1/products/search`;
    if (encodedName) {
        url += `?product_name=${encodedName}`;
    }
    console.log("API URL:", url);
    return axios1.post<IBackendRes<IProductDetail>>(url);
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

export const processDataProductDetail = (product: IProductDetail | null) => {
    if (!product) return [];
    
    // Create sections for SectionList
    return [
        {
            title: "Description",
            index: 0,
            data: [{ 
                id: "description", 
                content: product.product_description 
            }]
        },
        {
            title: "Details",
            index: 1,
            data: [{ 
                id: "details",
                type: product.product_type,
                brand: product.product_attributes?.brand,
                size: product.product_attributes?.size,
                material: product.product_attributes?.material
            }]
        },
        {
            title: "Reviews",
            index: 2,
            data: [{ 
                id: "reviews",
                rating: product.product_ratingsAverage || 4.5
            }]
        }
    ];
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

export const placeOrderAPI = (data: any) => {
    const url = `/api/v1/orders`;
    return axios.post<IBackendRes<IUserLogin>>(url, { ...data });
}

export const getOrderHistoryAPI = () => {
    const url = `/api/v1/orders`;
    return axios.get<IBackendRes<IOrderHistory[]>>(url);
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
export const increaseCartItemQuantityAPI = (productId: string) => {
    const url = `/api/v1/carts/increase/${productId}`;
    return axios1.put<IBackendRes<ICartResponse>>(url);
}

// Update cart item quantity (decrease)
export const decreaseCartItemQuantityAPI = (productId: string) => {
    const url = `/api/v1/carts/decrease/${productId}`;
    return axios1.put<IBackendRes<ICartResponse>>(url);
}

// Delete cart item
export const deleteCartItemAPI = (productId: string) => {
    const url = `/api/v1/carts`;
    return axios1.delete<IBackendRes<ICartResponse>>(url, { 
        data: {
            productId,
        },
    });
}




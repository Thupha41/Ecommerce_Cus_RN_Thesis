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

export const chatWithAI = async (user_id: string, session_id: string, text: string, image?: string) => {
    try {
        // Use the device's network IP instead of localhost
        const url = Platform.OS === 'android' 
            ? 'http://10.0.2.2:8082/chat/'  // Android emulator
            : 'http://localhost:8082/chat/'; // iOS simulator
            
        // If using a physical device, use your computer's local IP address
        // const url = 'http://192.168.1.xxx:8082/chat/'; // Replace with your computer's IP

        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('session_id', session_id);
        formData.append('text', text);
        
        if (image) {
            formData.append('image', image);
        }

        console.log('Sending request to:', url);
        console.log('FormData:', formData);

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 10000,
        });

        return response;
    } catch (error) {
        console.log('Full error:', error);
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

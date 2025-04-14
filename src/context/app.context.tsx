import { createContext, useContext, useState } from "react";

interface AppContextType {
  theme: string;
  setTheme: (v: string) => void;
  appState: IUserLogin | null;
  setAppState: (v: any) => void;

  cart: ICartResponse | Record<string, never>;
  setCart: (v: any) => void;

  restaurant: IRestaurant | null;
  setRestaurant: (v: any) => void;

  productDetail: IProductDetail | null;
  setProductDetail: (v: any) => void;
}
const AppContext = createContext<AppContextType | null>(null);

interface IProps {
  children: React.ReactNode;
}

const AppProvider = (props: IProps) => {
  const [theme, setTheme] = useState<string>("light");
  const [appState, setAppState] = useState<IUserLogin | null>(null);

  const [cart, setCart] = useState<ICartResponse | Record<string, never>>({});
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [productDetail, setProductDetail] = useState<IProductDetail | null>(
    null
  );
  console.log(">>> check appState", appState);
  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        appState,
        setAppState,
        cart,
        setCart,
        restaurant,
        setRestaurant,
        productDetail,
        setProductDetail,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const currentTheme = useContext(AppContext);

  if (!currentTheme) {
    throw new Error(
      "useCurrentApp has to be used within <AppContext.Provider>"
    );
  }

  return currentTheme;
};

export default AppProvider;

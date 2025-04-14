import { APP_COLOR } from "@/utils/constants";
import { router } from "expo-router";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentApp } from "@/context/app.context";
import { getCartItemsAPI, likeRestaurantAPI } from "@/utils/api";
import Toast from "react-native-root-toast";
import { useEffect, useState, useRef } from "react";
import { Feather, Entypo } from "@expo/vector-icons";
import { EventRegister } from "react-native-event-listeners";

const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons);
const { height: sHeight, width: sWidth } = Dimensions.get("window");

interface IProps {
  headerHeight: number;
  imageHeight: number;

  animatedBackgroundStyle: any;
  animatedArrowColorStyle: any;
  animatedStickyHeaderStyle: any;
  animatedHeartIconStyle: any;
}

const StickyHeader = (props: IProps) => {
  const insets = useSafeAreaInsets();
  const {
    headerHeight,
    imageHeight,
    animatedBackgroundStyle,
    animatedArrowColorStyle,
    animatedStickyHeaderStyle,
    animatedHeartIconStyle,
  } = props;

  const [like, setLike] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const { restaurant, appState } = useCurrentApp();
  const cartIconRef = useRef(null);
  const cartIconPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (restaurant) {
      setLike(restaurant.isLike);
    }
  }, [restaurant]);

  useEffect(() => {
    // Fetch initial cart count
    if (appState?.user?._id) {
      fetchCartCount();
    }

    // Listen for cart updates
    const updateCartListener = EventRegister.addEventListener(
      "updateCartCount",
      () => {
        fetchCartCount();
        // Add a small animation to the cart icon
        if (cartIconRef.current) {
          // You could add a bounce or highlight animation here
        }
      }
    );

    // Listen for position requests
    const positionListener = EventRegister.addEventListener(
      "getCartPosition",
      (callback) => {
        if (typeof callback === "function") {
          callback(cartIconPosition.current);
        }
      }
    );

    return () => {
      EventRegister.removeEventListener(updateCartListener as string);
      EventRegister.removeEventListener(positionListener as string);
    };
  }, [appState?.user?._id]);

  const fetchCartCount = async () => {
    try {
      if (appState?.user?._id) {
        const response = await getCartItemsAPI(appState.user._id);
        if (response.result) {
          // Calculate total items in cart
          const totalItems =
            response.result.cart_products?.reduce((total, item) => {
              return total + (item.product_quantity || 0);
            }, 0) || 0;

          setCartCount(totalItems);
        }
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  const handleLikeRestaurant = async () => {
    //chỉ thực hiện khi user đã đăng nhập
    if (appState?.user._id && restaurant) {
      //lấy phủ định
      const quantity = like === true ? -1 : 1;
      const res = await likeRestaurantAPI(restaurant?._id, quantity);
      if (res.result) {
        //success
        setLike(!like);
      } else {
        const m = Array.isArray(res.message) ? res.message[0] : res.message;

        Toast.show(m, {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
          opacity: 1,
        });
      }
    }
  };

  // Measure cart icon position
  const measureCartIcon = () => {
    if (cartIconRef.current) {
      // Type assertion to View since we know cartIconRef is a ref to a View component
      (cartIconRef.current as unknown as View).measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          cartIconPosition.current = {
            x: pageX + width / 2,
            y: pageY + height / 2,
          };
        }
      );
    }
  };

  // nút Back và like/dislike gộp vào component này, vì nó có zIndex cao nhất => có thể pressabled
  return (
    <>
      <View
        style={{
          zIndex: 11,
          paddingTop: insets.top + 10,
          paddingHorizontal: 10,
          height: headerHeight,
          position: "absolute",
          width: sWidth,
        }}
        onLayout={measureCartIcon}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
          }}
        >
          <Pressable
            style={({ pressed }) => [
              {
                opacity: pressed === true ? 0.5 : 1,
              },
            ]}
            onPress={() => router.back()}
          >
            <Animated.View
              style={[
                animatedBackgroundStyle,
                {
                  height: 30,
                  width: 30,
                  borderRadius: 30 / 2,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <AnimatedMaterialIcons
                name="arrow-back"
                size={24}
                style={animatedArrowColorStyle}
              />
            </Animated.View>
          </Pressable>
          <Animated.View style={[{ flex: 1 }, animatedStickyHeaderStyle]}>
            <TextInput
              placeholder={"Tìm sản phẩm tại shop..."}
              style={{
                borderWidth: 1,
                borderColor: APP_COLOR.GREY,
                width: "100%",
                borderRadius: 3,
                paddingHorizontal: 10,
                paddingVertical: Platform.OS === "android" ? 0 : 10,
              }}
            />
          </Animated.View>

          {/* Share Icons */}
          <Animated.View
            style={[animatedStickyHeaderStyle, styles.iconContainer]}
          >
            <Pressable
              style={({ pressed }) => [
                {
                  opacity: pressed === true ? 0.5 : 1,
                },
              ]}
              onPress={() => console.log("Share pressed")}
            >
              <Feather name="share" size={22} color="#333" />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[animatedStickyHeaderStyle, styles.iconContainer]}
          >
            <Pressable
              style={({ pressed }) => [
                {
                  opacity: pressed === true ? 0.5 : 1,
                },
              ]}
              onPress={() =>
                router.navigate({
                  pathname: "/(user)/cart/[id]",
                  params: {
                    id: appState?.user._id ?? "",
                  },
                })
              }
              ref={cartIconRef}
            >
              <Feather name="shopping-cart" size={22} color="#333" />
              {cartCount > 0 && (
                <Animated.View style={styles.badge}>
                  <Animated.Text
                    style={[
                      { color: "white", fontSize: 10, fontWeight: "bold" },
                    ]}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Animated.Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[animatedStickyHeaderStyle, styles.iconContainer]}
          >
            <Pressable
              style={({ pressed }) => [
                {
                  opacity: pressed === true ? 0.5 : 1,
                },
              ]}
              onPress={() => console.log("Menu pressed")}
            >
              <Feather name="menu" size={22} color="#333" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
      {/* background */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: headerHeight,
            backgroundColor: "white",
          },
          animatedStickyHeaderStyle,
        ]}
      />

      {/* like/dislike a restaurant */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: imageHeight + 80,
            right: 10,
            zIndex: 9,
          },
          animatedHeartIconStyle,
        ]}
      >
        <MaterialIcons
          onPress={handleLikeRestaurant}
          name={like === true ? "favorite" : "favorite-outline"}
          size={20}
          color={like === true ? APP_COLOR.ORANGE : APP_COLOR.GREY}
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    height: 30,
    width: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -10,
    backgroundColor: APP_COLOR.ORANGE,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: "white",
  },
});

export default StickyHeader;

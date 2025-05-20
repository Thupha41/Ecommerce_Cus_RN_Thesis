import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SectionList,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  interpolateColor,
} from "react-native-reanimated";
import { router } from "expo-router";
import Info from "./info";
import { APP_COLOR } from "@/utils/constants";
import StickyHeader from "./sticky.header";
import { useRef, useState, useMemo } from "react";
import { AntDesign } from "@expo/vector-icons";
import { getURLBaseBackend } from "@/utils/api";
import StickyBottom from "./sticky.bottom";
import { useCurrentApp } from "@/context/app.context";
import ProductDescription from "@/components/product/product-description";

// Define item types for each section
interface SectionItem {
  id: string;
  type: "description" | "details" | "rating" | "shop";
  content?: string;
  productType?: string;
  brand?: string;
  size?: string;
  material?: string;
  rating?: number;
  shopName?: string;
}

// Define section interface
interface Section {
  title: string;
  index: number;
  data: SectionItem[];
}

// Create a simple animated SectionList without complex typing
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const { height: sHeight, width: sWidth } = Dimensions.get("window");

const HEADER_HEIGHT = 50;
const IMAGE_HEIGHT = 350;
const INFO_HEIGHT = 450;
const SLIDE_MENU_HEIGHT = 60;
const MAX_DESCRIPTION_LINES = 3;
const BOTTOM_BAR_HEIGHT = 60;

const RMain = () => {
  const { productDetail } = useCurrentApp();
  const scrollY = useSharedValue(0);

  const sectionListRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | string>(0);
  const blockUpdateRef = useRef<boolean>(false);

  // Create menu data from product detail
  const menuData = useMemo(() => {
    // Trích xuất thông tin từ product_attributes
    const getAttributeValue = (name: string) => {
      const attribute = productDetail?.product_attributes?.find(
        (attr) => attr.name === name
      );
      return attribute?.value || "Không có thông tin";
    };

    // Default empty sections array that matches the expected type
    const defaultSections: Section[] = [
      {
        title: "Mô tả",
        index: 0,
        data: [
          {
            id: "description",
            type: "description",
            content: productDetail?.product_description || "",
          },
        ],
      },
      {
        title: "Chi tiết sản phẩm",
        index: 1,
        data: [
          {
            id: "details",
            type: "details",
            productType: getAttributeValue("Cung cấp bởi"),
            brand: getAttributeValue("Thương hiệu"),
            size: getAttributeValue("Chất liệu"),
            material: getAttributeValue("Xuất xứ thương hiệu"),
          },
        ],
      },
      {
        title: "Đánh giá và bình luận",
        index: 2,
        data: [
          {
            id: "ratings",
            type: "rating",
            rating: productDetail?.product_ratingsAverage || 4.5,
          },
        ],
      },
      {
        title: "Shop",
        index: 3,
        data: [
          {
            id: "shop",
            type: "shop",
            shopName: productDetail?.shop?.shop_name || "Shop",
          },
        ],
      },
    ];

    return defaultSections;
  }, [productDetail]);

  // Create menu items for horizontal list
  const menuItems = useMemo(() => {
    return menuData.map((section, index) => ({
      title: section.title,
      index,
    }));
  }, [menuData]);

  // Scroll handler to update the scrollY value
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Fade-in effect for the product header
  const animatedStickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    const pointerEvents = opacity === 0 ? "none" : "auto";

    return {
      opacity,
      pointerEvents, //on/off click input
    };
  });

  // Sticky positioning for the menu below the header
  const animatedMenuStyle = useAnimatedStyle(() => {
    const range = IMAGE_HEIGHT + INFO_HEIGHT - HEADER_HEIGHT;
    const translateY = interpolate(
      scrollY.value,
      [0, range], // Define scroll range
      [0, -range - 2], //2px menu border
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      position: "absolute",
      top: IMAGE_HEIGHT + INFO_HEIGHT,
      zIndex: 2,
      width: "100%",
      backgroundColor: "white",
    };
  });

  const animatedInfoStyle = useAnimatedStyle(() => {
    const range = IMAGE_HEIGHT + INFO_HEIGHT - HEADER_HEIGHT;

    const translateY = interpolate(
      scrollY.value,
      [0, range], // Define scroll range
      [0, -range],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      position: "absolute",
      top: IMAGE_HEIGHT,
      zIndex: 1,
      width: "100%",
    };
  });

  const animatedHeartIconStyle = useAnimatedStyle(() => {
    const range = IMAGE_HEIGHT + INFO_HEIGHT - HEADER_HEIGHT;

    const translateY = interpolate(
      scrollY.value,
      [0, range], // Define scroll range
      [0, -range],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  // Animated styles for background
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        scrollY.value,
        [0, 100],
        ["rgba(0,0,0,0.3)", "transparent"]
      ),
    };
  });

  // Animate arrow color
  const animatedArrowColorStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        scrollY.value,
        [0, 100],
        ["white", APP_COLOR.ORANGE] // Arrow color range
      ),
    };
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (viewableItems.length > 0 && !blockUpdateRef.current) {
        const visibleSectionIndex = viewableItems[0].section?.index;
        if (visibleSectionIndex !== undefined) {
          setActiveMenuIndex(visibleSectionIndex);
          flatListRef.current?.scrollToIndex({
            index: visibleSectionIndex,
            animated: true,
          });
        }
      }
    }
  ).current;

  return (
    <View style={styles.container}>
      <StickyHeader
        headerHeight={HEADER_HEIGHT}
        imageHeight={IMAGE_HEIGHT}
        animatedBackgroundStyle={animatedBackgroundStyle}
        animatedArrowColorStyle={animatedArrowColorStyle}
        animatedStickyHeaderStyle={animatedStickyHeaderStyle}
        animatedHeartIconStyle={animatedHeartIconStyle}
      />

      {/*  Image */}
      <View style={styles.header}>
        <Image
          source={{
            uri: `${productDetail?.product_thumb}`,
          }}
          style={styles.headerImage}
        />
      </View>

      {/* Info */}
      <Animated.View style={[animatedInfoStyle]}>
        <Info infoHeight={INFO_HEIGHT} productDetail={productDetail} />
      </Animated.View>

      {/* Sticky Menu */}
      <Animated.View style={[animatedMenuStyle]}>
        <FlatList
          ref={flatListRef}
          horizontal
          data={menuItems}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                blockUpdateRef.current = true;
                setActiveMenuIndex(index);
                sectionListRef.current?.scrollToLocation({
                  sectionIndex: index,
                  itemIndex: 0,
                  viewOffset: HEADER_HEIGHT + SLIDE_MENU_HEIGHT,
                });
                setTimeout(() => {
                  blockUpdateRef.current = false;
                }, 1000);
              }}
            >
              <View
                style={{
                  paddingHorizontal: 15,
                  height: SLIDE_MENU_HEIGHT,
                  justifyContent: "center",
                  borderBottomWidth: 2,
                  borderBottomColor:
                    index === activeMenuIndex
                      ? APP_COLOR.ORANGE
                      : "transparent",
                }}
              >
                <Text
                  style={[
                    styles.menuItem,
                    {
                      color:
                        index === activeMenuIndex ? APP_COLOR.ORANGE : "#666",
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>

      {/* Scrollable Content */}
      <AnimatedSectionList
        ref={sectionListRef}
        style={{ zIndex: 1 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingTop: IMAGE_HEIGHT + INFO_HEIGHT + SLIDE_MENU_HEIGHT - 2,
          paddingBottom: BOTTOM_BAR_HEIGHT + 20, // Add padding to account for sticky bottom
        }}
        sections={menuData}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item, section }: { item: any; section: any }) => {
          if ((item as any).type === "description") {
            return (
              <ProductDescription
                htmlContent={item.content}
                maxLines={MAX_DESCRIPTION_LINES}
              />
            );
          } else if (item.type === "details") {
            return (
              <View style={{ padding: 15, backgroundColor: "white" }}>
                {/* Hiển thị tất cả thuộc tính sản phẩm */}
                {productDetail?.product_attributes &&
                productDetail.product_attributes.length > 0 ? (
                  <>
                    {productDetail.product_attributes.map((attr, index) => (
                      <View
                        key={index}
                        style={{ flexDirection: "row", marginBottom: 8 }}
                      >
                        <Text style={{ width: 140, color: "#666" }}>
                          {attr.name}:
                        </Text>
                        <Text style={{ flex: 1, color: "#333" }}>
                          {attr.value}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={styles.emptyMessage}>
                    Không có thông tin chi tiết sản phẩm
                  </Text>
                )}
              </View>
            );
          } else if (item.type === "rating") {
            return (
              <View style={{ padding: 15, backgroundColor: "white" }}>
                {/* Rating overview */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      marginRight: 10,
                    }}
                  >
                    {productDetail?.product_ratingsAverage.toFixed(1) || "0"}
                  </Text>
                  <View>
                    <View style={{ flexDirection: "row", marginBottom: 5 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <AntDesign
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <=
                            Math.round(
                              productDetail?.product_ratingsAverage || 0
                            )
                              ? "#FFD700"
                              : "#ccc"
                          }
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Đánh giá sản phẩm
                    </Text>
                  </View>
                </View>

                {/* Sample reviews - Placeholder for now */}
                <View style={{ marginBottom: 15 }}>
                  <Text
                    style={{
                      fontStyle: "italic",
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    Chưa có đánh giá nào cho sản phẩm này
                  </Text>
                </View>
              </View>
            );
          } else if (item.type === "shop") {
            return (
              <View style={{ padding: 15, backgroundColor: "white" }}>
                {/* Shop header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (productDetail?.shop?._id) {
                        router.push({
                          pathname: "/(user)/shop/[id]",
                          params: { id: productDetail.shop._id },
                        });
                      }
                    }}
                  >
                    {productDetail?.shop?.shop_logo ? (
                      <Image
                        source={{ uri: productDetail.shop.shop_logo }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          marginRight: 10,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: APP_COLOR.ORANGE,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          {productDetail?.shop?.shop_name?.charAt(0) || "S"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (productDetail?.shop?._id) {
                          router.push({
                            pathname: "/(user)/shop/[id]",
                            params: { id: productDetail.shop._id },
                          });
                        }
                      }}
                    >
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                        {productDetail?.shop?.shop_name || "Shop"}
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 3,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <AntDesign name="star" size={12} color="#FFD700" />
                        <Text
                          style={{ color: "#666", fontSize: 12, marginLeft: 2 }}
                        >
                          {productDetail?.shop?.shop_rating?.toFixed(1) ||
                            "0.0"}
                        </Text>
                      </View>
                      <Text style={{ color: "#666", fontSize: 12 }}>
                        {productDetail?.shop?.total_products || 0} sản phẩm
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: APP_COLOR.ORANGE,
                      paddingHorizontal: 15,
                      paddingVertical: 5,
                      borderRadius: 3,
                    }}
                    onPress={() => {
                      if (productDetail?.shop?._id) {
                        router.push({
                          pathname: "/(user)/shop/[id]",
                          params: { id: productDetail.shop._id },
                        });
                      }
                    }}
                  >
                    <Text style={{ color: APP_COLOR.ORANGE }}>Xem Shop</Text>
                  </TouchableOpacity>
                </View>

                {/* Shop stats */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginBottom: 15,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>
                      {productDetail?.shop?.shop_rating?.toFixed(1) || "0.0"}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Đánh giá
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>
                      {productDetail?.shop?.total_products || 0}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Sản phẩm
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>
                      {productDetail?.shop?.shop_response_rate || 0}%
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Phản hồi
                    </Text>
                  </View>
                </View>

                {/* Other products */}
                {productDetail?.other_shop_products &&
                productDetail.other_shop_products.length > 0 ? (
                  <View style={{ marginTop: 10 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontWeight: "bold" }}>
                        Các sản phẩm khác của Shop
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (productDetail?.shop?._id) {
                            router.push({
                              pathname: "/(user)/shop/[id]",
                              params: { id: productDetail.shop._id },
                            });
                          }
                        }}
                      >
                        <Text style={{ color: APP_COLOR.ORANGE }}>
                          Xem tất cả ({productDetail?.shop?.total_products || 0}
                          )
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      horizontal
                      data={productDetail.other_shop_products}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => item._id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{
                            width: 130,
                            marginRight: 10,
                            backgroundColor: "#fff",
                          }}
                          onPress={() => {
                            router.push({
                              pathname: "/(user)/product/[id]",
                              params: { id: item._id },
                            });
                          }}
                        >
                          <Image
                            source={{ uri: item.product_thumb }}
                            style={{
                              width: 130,
                              height: 130,
                              borderRadius: 5,
                              marginBottom: 5,
                            }}
                            resizeMode="cover"
                          />
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 13,
                              marginBottom: 3,
                              height: 36,
                            }}
                          >
                            {item.product_name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "bold",
                              color: APP_COLOR.ORANGE,
                            }}
                          >
                            {item.product_price
                              ? `${item.product_price
                                  .toString()
                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}đ`
                              : "Liên hệ"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                ) : (
                  <Text style={styles.emptyMessage}>
                    Không có sản phẩm khác từ Shop này
                  </Text>
                )}
              </View>
            );
          } else {
            return null;
          }
        }}
        renderSectionHeader={({ section }: { section: any }) => (
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 10,
              paddingTop: 10,
            }}
          >
            <Text style={{ textTransform: "uppercase", fontWeight: "bold" }}>
              {section.title}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ backgroundColor: "white", paddingHorizontal: 10 }}>
            <View
              style={{
                height: 1,
                backgroundColor: "#ccc",
                marginVertical: 5,
              }}
            />
          </View>
        )}
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 1,
          waitForInteraction: true,
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        onMomentumScrollEnd={() => (blockUpdateRef.current = false)}
      />

      {/* Sticky Bottom Bar - positioned absolutely at the bottom */}
      <View style={styles.stickyBottomContainer}>
        <StickyBottom
          price={productDetail?.product_price || 14.5}
          onChat={() => console.log("Chat pressed")}
          // onAddToCart={() => console.log("Add to cart pressed")}
          onBuyWithVoucher={() => console.log("Buy with voucher pressed")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  menuItem: {
    fontSize: 14,
    fontWeight: "bold",
  },
  header: {
    width: sWidth,
    height: IMAGE_HEIGHT,
    top: 0,
    left: 0,
    position: "absolute",
    zIndex: 1,
  },
  headerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  stickyBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  emptyMessage: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default RMain;

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
import Info from "./info";
import { APP_COLOR } from "@/utils/constants";
import StickyHeader from "./sticky.header";
import { useRef, useState, useMemo } from "react";
import { AntDesign } from "@expo/vector-icons";
import { getURLBaseBackend } from "@/utils/api";
import StickyBottom from "./sticky.bottom";
import { useCurrentApp } from "@/context/app.context";

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

const HEADER_HEIGHT = 120;
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
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Create menu data from product detail
  const menuData = useMemo(() => {
    // Default empty sections array that matches the expected type
    const defaultSections: Section[] = [
      {
        title: "Mô tả",
        index: 0,
        data: [
          {
            id: "description",
            type: "description",
            content:
              productDetail?.product_description || "No description available",
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
            productType: productDetail?.product_type,
            brand: productDetail?.product_attributes?.brand,
            size: productDetail?.product_attributes?.size,
            material: productDetail?.product_attributes?.material,
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
            shopName: "Mai Thảo Shop",
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

  // Toggle description expand/collapse
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

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
              <View style={{ padding: 15, backgroundColor: "white" }}>
                <Text
                  style={{ lineHeight: 20 }}
                  numberOfLines={
                    showFullDescription ? undefined : MAX_DESCRIPTION_LINES
                  }
                >
                  {item.content}
                </Text>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    alignSelf: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                  onPress={toggleDescription}
                >
                  <Text
                    style={{
                      color: APP_COLOR.ORANGE,
                      marginRight: 5,
                    }}
                  >
                    {showFullDescription ? "Thu gọn" : "Xem thêm"}
                  </Text>
                  <AntDesign
                    name={showFullDescription ? "up" : "down"}
                    size={14}
                    color={APP_COLOR.ORANGE}
                  />
                </TouchableOpacity>
              </View>
            );
          } else if (item.type === "details") {
            return (
              <View style={{ padding: 15, backgroundColor: "white" }}>
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                  <Text style={{ width: 100, color: "#666" }}>Loại:</Text>
                  <Text>{item.productType}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                  <Text style={{ width: 100, color: "#666" }}>
                    Thương hiệu:
                  </Text>
                  <Text>{item.brand}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 5 }}>
                  <Text style={{ width: 100, color: "#666" }}>Kích thước:</Text>
                  <Text>{item.size}</Text>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ width: 100, color: "#666" }}>Chất liệu:</Text>
                  <Text>{item.material}</Text>
                </View>
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
                    {item.rating}
                  </Text>
                  <View>
                    <View style={{ flexDirection: "row", marginBottom: 5 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <AntDesign
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <= Math.round(item.rating || 5)
                              ? "#FFD700"
                              : "#ccc"
                          }
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      4 đánh giá
                    </Text>
                  </View>
                </View>

                {/* Sample reviews */}
                <View style={{ marginBottom: 15 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: "#f5f5f5",
                        marginRight: 10,
                      }}
                    />
                    <View>
                      <Text style={{ fontWeight: "bold" }}>Nguyễn Văn A</Text>
                      <View style={{ flexDirection: "row" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <AntDesign
                            key={star}
                            name="star"
                            size={12}
                            color="#FFD700"
                            style={{ marginRight: 2 }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text>
                    Sản phẩm rất tốt, đóng gói cẩn thận, giao hàng nhanh!
                  </Text>
                </View>

                {/* Product videos */}
                <View>
                  <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
                    Video về sản phẩm
                  </Text>
                  <View style={{ flexDirection: "row" }}>
                    <View
                      style={{
                        width: 150,
                        height: 100,
                        backgroundColor: "#f5f5f5",
                        marginRight: 10,
                        borderRadius: 5,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          right: 10,
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 12 }}>
                          Hộp quà Romand Juicy trái cây mini...
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        width: 150,
                        height: 100,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 5,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          right: 10,
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 12 }}>
                          #ShopeeCreator #shopeevideo #m...
                        </Text>
                      </View>
                    </View>
                  </View>
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
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#f5f5f5",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ textAlign: "center", lineHeight: 50 }}>
                      MT
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                      {item.shopName}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Online 3 giờ trước
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Đồng Nai
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: APP_COLOR.ORANGE,
                      paddingHorizontal: 15,
                      paddingVertical: 5,
                      borderRadius: 3,
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
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>5.0</Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Đánh giá
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>190</Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Sản phẩm
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold" }}>100%</Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Phản hồi Chat
                    </Text>
                  </View>
                </View>

                {/* Other products */}
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
                    <TouchableOpacity>
                      <Text style={{ color: APP_COLOR.ORANGE }}>
                        Xem tất cả
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    horizontal
                    data={[1, 2, 3, 4]}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <View style={{ width: 120, marginRight: 10 }}>
                        <View
                          style={{
                            height: 120,
                            backgroundColor: "#f5f5f5",
                            marginBottom: 5,
                          }}
                        />
                        <Text numberOfLines={2} style={{ fontSize: 12 }}>
                          Son Tint Bóng Peripera
                        </Text>
                        <Text
                          style={{
                            color: APP_COLOR.ORANGE,
                            fontWeight: "bold",
                          }}
                        >
                          đ155.000
                        </Text>
                        <Text style={{ fontSize: 10, color: "#666" }}>
                          Đã bán 142
                        </Text>
                      </View>
                    )}
                  />
                </View>
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
          onAddToCart={() => console.log("Add to cart pressed")}
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
});

export default RMain;

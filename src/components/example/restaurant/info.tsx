import { APP_COLOR } from "@/utils/constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { currencyFormatter } from "@/utils/api";

interface IProps {
  infoHeight: number;
  productDetail: IProductDetail | null;
}

const Info = (props: IProps) => {
  const { infoHeight, productDetail } = props;

  // Calculate discount price (for display purposes)
  const originalPrice = productDetail?.product_price
    ? productDetail.product_price * 1.15
    : 16.7;
  const discountPercentage = 15;

  return (
    <View
      style={{
        height: infoHeight,
        backgroundColor: "#fff",
      }}
    >
      {/* Product name with favorite tag */}
      <View style={{ height: 60, margin: 10 }}>
        <Text style={{ lineHeight: 30 }} numberOfLines={2} ellipsizeMode="tail">
          <View>
            <Text
              style={{
                color: "white",
                backgroundColor: APP_COLOR.ORANGE,
                padding: 3,
                paddingHorizontal: 5,
                borderRadius: 3,
                fontSize: 12,
              }}
            >
              Yêu thích
            </Text>
          </View>
          <Text>{` `}</Text>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {productDetail?.product_name || "Bộ hầu gái"}
          </Text>
        </Text>
      </View>

      {/* Price section */}
      <View style={{ marginHorizontal: 10, marginBottom: 10 }}>
        <Text
          style={{ fontSize: 24, color: APP_COLOR.ORANGE, fontWeight: "bold" }}
        >
          {currencyFormatter(productDetail?.product_price || 14.5)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text
            style={{
              fontSize: 16,
              color: "#999",
              textDecorationLine: "line-through",
            }}
          >
            {currencyFormatter(originalPrice)}
          </Text>
          <View
            style={{
              backgroundColor: APP_COLOR.ORANGE,
              padding: 2,
              borderRadius: 2,
            }}
          >
            <Text style={{ color: "white", fontSize: 12 }}>
              -{discountPercentage}%
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 10, backgroundColor: "#e9e9e9" }}></View>
      <View style={{ justifyContent: "space-between", flex: 1 }}>
        <View style={{ marginHorizontal: 10, marginVertical: 5, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View
              style={{
                height: 25,
                width: 25,
                borderRadius: 50 / 2,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(255,192,203,0.3)",
              }}
            >
              <AntDesign name="rocket1" size={20} color={APP_COLOR.ORANGE} />
            </View>
            <View>
              <Text>Giao hàng tiêu chuẩn</Text>
            </View>
          </View>
          <View style={{ height: 2, backgroundColor: "#e9e9e9" }}></View>
          <View style={{ gap: 5 }}>
            <View
              style={{ flexDirection: "row", gap: 5, alignItems: "center" }}
            >
              <AntDesign name="gift" size={25} color={APP_COLOR.ORANGE} />
              <Text>Giảm 20% tối đa 55k cho đơn từ 200k</Text>
            </View>
          </View>
          <View style={{ height: 2, backgroundColor: "#e9e9e9" }}></View>
        </View>

        <View style={{ marginHorizontal: 10, marginVertical: 5, gap: 10 }}>
          {/* Delivery section */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialIcons
              name="local-shipping"
              size={20}
              color={APP_COLOR.ORANGE}
            />
            <View>
              <Text>Miễn phí vận chuyển</Text>
              <Text style={{ color: "#666", fontSize: 12 }}>
                Miễn phí vận chuyển
              </Text>
            </View>
          </View>

          <View style={{ height: 2, backgroundColor: "#e9e9e9" }}></View>

          {/* Return policy */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialIcons
              name="assignment-return"
              size={20}
              color={APP_COLOR.ORANGE}
            />
            <Text>Trả hàng miễn phí 15 ngày</Text>
          </View>

          <View style={{ height: 2, backgroundColor: "#e9e9e9" }}></View>

          {/* Payment options */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialIcons name="payment" size={20} color={APP_COLOR.ORANGE} />
            <Text>SPayLater: Mua trước trả sau</Text>
          </View>

          <View style={{ height: 2, backgroundColor: "#e9e9e9" }}></View>

          {/* Quantity */}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MaterialIcons
              name="inventory"
              size={20}
              color={APP_COLOR.ORANGE}
            />
            <Text>
              Số lượng có sẵn: {productDetail?.product_quantity || 10}
            </Text>
          </View>
        </View>
        <View style={{ height: 10, backgroundColor: "#e9e9e9" }}></View>
      </View>
      {/* Product attributes */}
      {/* <View style={{ marginHorizontal: 10, marginVertical: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text style={{ color: "#666" }}>Loại:</Text>
          <Text>{productDetail?.product_type || "Clothing"}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
          <Text style={{ color: "#666" }}>Thương hiệu:</Text>
          <Text>{productDetail?.product_attributes?.brand || "Cotton"}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
          <Text style={{ color: "#666" }}>Kích thước:</Text>
          <Text>{productDetail?.product_attributes?.size || "XL"}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
          <Text style={{ color: "#666" }}>Chất liệu:</Text>
          <Text>{productDetail?.product_attributes?.material || "cotton"}</Text>
        </View>
      </View> */}
    </View>
  );
};

export default Info;

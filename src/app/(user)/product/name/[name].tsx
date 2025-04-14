import RMain from "@/components/example/restaurant/main";
import { getProductByNameAPI } from "@/utils/api";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Text,
  View,
  Alert,
  Button,
  ActivityIndicator,
} from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";
import { useCurrentApp } from "@/context/app.context";
const { height: sHeight, width: sWidth } = Dimensions.get("window");

const ProductPage = () => {
  const { name } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setProductDetail } = useCurrentApp();

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!name) {
          console.error("No product name provided");
          setError("Không tìm thấy tên sản phẩm");
          setLoading(false);
          return;
        }

        // Encode tên sản phẩm để tránh vấn đề với các ký tự đặc biệt
        const encodedName = encodeURIComponent(name as string);
        console.log("Fetching product with name:", name);
        console.log("Encoded name:", encodedName);

        const response = await getProductByNameAPI(encodedName);
        console.log(">>> check response", response);

        // Log the entire response to debug
        console.log("API Response:", JSON.stringify(response, null, 2));

        // Check if we have result data in the response
        if (response && response.result) {
          console.log("Setting product detail:", response.result);
          setProductDetail(response.result);
        } else {
          console.error("No product data in response:", response);
          setError("Không thể tải thông tin sản phẩm");
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);

        // Xử lý lỗi chi tiết hơn
        if (error.response) {
          console.error("Error response:", error.response);
          setError(`Lỗi server: ${error.response.status}`);
        } else if (error.request) {
          console.error("Error request:", error.request);
          setError("Không thể kết nối đến máy chủ");
        } else {
          setError(`Lỗi: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [name, setProductDetail]);

  // Trở về trang trước đó
  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ContentLoader
          speed={2}
          width={700}
          height={sHeight}
          backgroundColor="#f3f3f3"
          foregroundColor="#ecebeb"
          style={{ width: "100%" }}
        >
          <Rect x="0" y="0" rx="3" ry="3" width={sWidth} height="120" />
          <Rect
            x="10"
            y="140"
            rx="10"
            ry="10"
            width={sWidth - 50}
            height="20"
          />
          <Rect
            x="10"
            y="170"
            rx="10"
            ry="10"
            width={sWidth - 150}
            height="20"
          />
          <Rect x="10" y="220" rx="5" ry="5" width={100} height="100" />
          <Rect x="130" y="220" rx="10" ry="10" width={150} height="20" />
          <Rect x="130" y="250" rx="10" ry="10" width={100} height="20" />
          <Rect x="130" y="280" rx="10" ry="10" width={200} height="20" />
          <Rect x="10" y="340" rx="5" ry="5" width={100} height="100" />
          <Rect x="130" y="340" rx="10" ry="10" width={150} height="20" />
          <Rect x="130" y="370" rx="10" ry="10" width={100} height="20" />
          <Rect x="130" y="400" rx="10" ry="10" width={200} height="20" />
          <Rect x="10" y="460" rx="5" ry="5" width={100} height="100" />
          <Rect x="130" y="460" rx="10" ry="10" width={150} height="20" />
          <Rect x="130" y="490" rx="10" ry="10" width={100} height="20" />
          <Rect x="130" y="520" rx="10" ry="10" width={200} height="20" />
        </ContentLoader>
      ) : error ? (
        // Hiển thị thông báo lỗi
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: "red",
            }}
          >
            {error}
          </Text>
          <Text style={{ textAlign: "center", marginBottom: 20 }}>
            Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
          </Text>
          <Button title="Quay lại" onPress={handleGoBack} />
        </View>
      ) : (
        // Hiển thị thông tin sản phẩm
        <RMain />
      )}
    </View>
  );
};

export default ProductPage;

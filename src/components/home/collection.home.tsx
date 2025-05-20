import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import demo from "@/assets/demo.jpg";
import { APP_COLOR } from "@/utils/constants";
import { useEffect, useState } from "react";
import { getTopProducts } from "@/utils/api";
import { router } from "expo-router";
import ContentLoader, { Rect } from "react-content-loader/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ProductCard from "@/components/card/card.product";

const { height: sHeight, width: sWidth } = Dimensions.get("window");

interface IProps {
  name: string;
  description: string;
  refAPI: string;
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  sale: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: APP_COLOR.ORANGE,
    padding: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
});
const CollectionHome = (props: IProps) => {
  const { name, description, refAPI } = props;
  const data = [
    { key: 1, image: demo, name: "cua hang 1" },
    { key: 2, image: demo, name: "cua hang 2" },
    { key: 3, image: demo, name: "cua hang 3" },
    { key: 4, image: demo, name: "cua hang 4" },
    { key: 5, image: demo, name: "cua hang 5" },
  ];
  const [products, setProducts] = useState<ITopProducts[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getTopProducts(refAPI);

      if (res.result) {
        setProducts(res.result);
      } else {
        //error
      }
      setLoading(false);
    };
    fetchData();
  }, [refAPI]);

  return (
    <>
      <View style={{ height: 10, backgroundColor: "#e9e9e9" }}></View>
      {loading === false ? (
        <View style={styles.container}>
          <View
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: APP_COLOR.ORANGE,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {name}
            </Text>
            <Pressable
              onPress={() => router.navigate("/(auth)/restaurants")}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#5a5a5a" }}>Xem tất cả</Text>
              <MaterialIcons
                style={{ marginTop: 3 }}
                name="navigate-next"
                size={20}
                color="grey"
              />
            </Pressable>
          </View>
          <View style={{ marginVertical: 5 }}>
            <Text style={{ color: "#5a5a5a" }}>{description}</Text>
          </View>
          <FlatList
            horizontal
            contentContainerStyle={{ gap: 5 }}
            showsHorizontalScrollIndicator={false}
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              return <ProductCard product={item} showFlashSale={true} />;
            }}
          />
        </View>
      ) : (
        <ContentLoader
          speed={2}
          width={sWidth}
          height={230}
          // viewBox="0 0 700 150"
          backgroundColor="#f3f3f3"
          foregroundColor="#ecebeb"
          style={{ width: "100%" }}
        >
          <Rect x="10" y="10" rx="5" ry="5" width={150} height="200" />
          <Rect x="170" y="10" rx="5" ry="5" width={150} height="200" />
          <Rect x="330" y="10" rx="5" ry="5" width={150} height="200" />
        </ContentLoader>
      )}
    </>
  );
};

export default CollectionHome;

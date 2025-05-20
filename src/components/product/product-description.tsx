import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { APP_COLOR } from "@/utils/constants";
import { parseHtmlContent } from "@/utils/htmlParser";

interface ProductDescriptionProps {
  htmlContent: string;
  maxLines?: number;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({
  htmlContent,
  maxLines = 3,
}) => {
  const [expanded, setExpanded] = useState(false);
  const parsedContent = parseHtmlContent(htmlContent);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <Text
        style={styles.descriptionText}
        numberOfLines={expanded ? undefined : maxLines}
      >
        {parsedContent}
      </Text>

      <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
        <Text style={styles.expandText}>
          {expanded ? "Thu gọn" : "Xem thêm"}
        </Text>
        <AntDesign
          name={expanded ? "up" : "down"}
          size={14}
          color={APP_COLOR.ORANGE}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "white",
  },
  descriptionText: {
    lineHeight: 20,
    fontSize: 14,
    color: "#333",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  expandText: {
    color: APP_COLOR.ORANGE,
    marginRight: 5,
    fontSize: 14,
  },
});

export default ProductDescription;

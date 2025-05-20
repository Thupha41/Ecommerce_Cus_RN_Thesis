import { chatWithAI, chatImageWithAI } from "@/utils/api";
import { APP_COLOR } from "@/utils/constants";
import { useEffect, useState, useRef } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Keyboard, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Camera from "expo-camera";
import ProductResults from "@/components/chat/product-results";
import { useCurrentApp } from "@/context/app.context";
// Interface for product results from AI

// Cấu trúc thực tế của API response
interface ApiResponse {
  action: string;
  status: string;
  response: {
    user_id: string;
    user_query: string;
    image: string;
    response: string;
    products: Array<{
      name: string;
      description: string;
      price: number;
      database_id: string;
      product_thumb: string;
    }>;
    timestamp: string;
    latency: number;
  };
}

interface ProductItem {
  name: string;
  product_thumb?: string;
  price?: number;
}

const AIChatPage = () => {
  const { appState } = useCurrentApp();

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      type: "text" | "image" | "products";
      content: string;
      sender: "user" | "ai";
      products?: ProductItem[];
    }>
  >([
    {
      id: `ai-welcome-${Date.now()}`,
      type: "text",
      content:
        "Xin chào! Mình là trợ lý AI của bạn tại EzShop. Mình đang phát triển nên không phải lúc nào cũng đúng. Bạn có thể phản hồi để giúp mình cải thiện tốt hơn.\n\nMình sẵn sàng giúp bạn với câu hỏi về chính sách và tìm kiếm sản phẩm. Hôm nay bạn cần mình hỗ trợ gì hông? ^^",
      sender: "ai",
    },
  ]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollViewRef.current) {
      // Đợi một chút để đảm bảo UI đã render xong
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const takePicture = async () => {
    // Request camera permissions using the new API
    const [permission, requestPermission] = Camera.useCameraPermissions();

    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log("Captured image:", imageUri);

        setMessages((prev) => [
          ...prev,
          {
            id: `user-image-${Date.now()}`,
            type: "image",
            content: imageUri,
            sender: "user",
          },
        ]);

        // Call AI with the image
        setIsLoading(true);
        scrollToBottom();

        try {
          const user_id = appState?.user?._id || "1";
          const response = await chatImageWithAI(user_id, "1", "", imageUri);

          // Parse the response data
          const apiData = response.data as ApiResponse;
          console.log("Raw image API response:", JSON.stringify(apiData));

          // Make sure we have data before trying to access it
          if (apiData && apiData.response) {
            // Extract data
            const responseText = apiData.response?.response || "";
            const productList = apiData.response?.products || [];

            // Display response text if available
            if (responseText) {
              const aiMsgId = `ai-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMsgId,
                  type: "text",
                  content: responseText,
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            } else {
              // Show error message if no text
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-error-${Date.now()}`,
                  type: "text",
                  content: "Xin lỗi, tôi không thể xử lý hình ảnh này.",
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            }

            // Display products if available
            if (productList && productList.length > 0) {
              const aiProductsMsgId = `ai-products-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiProductsMsgId,
                  type: "products",
                  content: "",
                  sender: "ai",
                  products: productList,
                },
              ]);
              scrollToBottom();
            }
          } else {
            // Fallback for missing data
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-error-${Date.now()}`,
                type: "text",
                content: "Xin lỗi, đã xảy ra lỗi khi xử lý hình ảnh.",
                sender: "ai",
              },
            ]);
            scrollToBottom();
          }
        } catch (error) {
          console.error("Error sending image to AI:", error);
          // Show user-friendly error
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-error-${Date.now()}`,
              type: "text",
              content:
                "Xin lỗi, đã xảy ra lỗi khi gửi hình ảnh. Vui lòng thử lại.",
              sender: "ai",
            },
          ]);
          scrollToBottom();
        } finally {
          setIsLoading(false);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      alert("Failed to take picture");
    }
  };

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need gallery permissions to make this work!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log("Selected image:", result.assets[0]);

        // Add message to UI
        setMessages((prev) => [
          ...prev,
          {
            id: `user-image-${Date.now()}`,
            type: "image",
            content: imageUri,
            sender: "user",
          },
        ]);

        // Call AI with the image
        setIsLoading(true);
        scrollToBottom();

        try {
          const user_id = appState?.user?._id || "1";
          const response = await chatImageWithAI(user_id, "1", "", imageUri);

          // Parse the response data
          const apiData = response.data as ApiResponse;
          console.log("Raw image API response:", JSON.stringify(apiData));

          // Make sure we have data before trying to access it
          if (apiData && apiData.response) {
            // Extract data
            const responseText = apiData.response?.response || "";
            const productList = apiData.response?.products || [];

            // Display response text if available
            if (responseText) {
              const aiMsgId = `ai-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMsgId,
                  type: "text",
                  content: responseText,
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            } else {
              // Show error message if no text
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-error-${Date.now()}`,
                  type: "text",
                  content: "Xin lỗi, tôi không thể xử lý hình ảnh này.",
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            }

            // Display products if available
            if (productList && productList.length > 0) {
              const aiProductsMsgId = `ai-products-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiProductsMsgId,
                  type: "products",
                  content: "",
                  sender: "ai",
                  products: productList,
                },
              ]);
              scrollToBottom();
            }
          } else {
            // Fallback for missing data
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-error-${Date.now()}`,
                type: "text",
                content: "Xin lỗi, đã xảy ra lỗi khi xử lý hình ảnh.",
                sender: "ai",
              },
            ]);
            scrollToBottom();
          }
        } catch (error) {
          console.error("Error sending image to AI:", error);
          // Show user-friendly error
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-error-${Date.now()}`,
              type: "text",
              content:
                "Xin lỗi, đã xảy ra lỗi khi gửi hình ảnh. Vui lòng thử lại.",
              sender: "ai",
            },
          ]);
          scrollToBottom();
        } finally {
          setIsLoading(false);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // all file types
        multiple: false,
      });

      if (!result.canceled) {
        const fileUri = result.assets[0].uri;
        console.log("Selected document:", result.assets[0]);

        // Add message to UI
        setMessages((prev) => [
          ...prev,
          {
            id: `user-doc-${Date.now()}`,
            type: "text",
            content: `Đã gửi tệp: ${result.assets[0].name}`,
            sender: "user",
          },
        ]);

        // Call AI with the document file
        setIsLoading(true);
        scrollToBottom();

        try {
          const user_id = appState?.user?._id || "1";
          const response = await chatImageWithAI(user_id, "1", "", fileUri);

          // Parse the response data
          const apiData = response.data as ApiResponse;
          console.log("Raw document API response:", JSON.stringify(apiData));

          // Make sure we have data before trying to access it
          if (apiData && apiData.response) {
            // Extract data
            const responseText = apiData.response?.response || "";
            const productList = apiData.response?.products || [];

            // Display response text if available
            if (responseText) {
              const aiMsgId = `ai-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMsgId,
                  type: "text",
                  content: responseText,
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            } else {
              // Show error message if no text
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-error-${Date.now()}`,
                  type: "text",
                  content: "Xin lỗi, tôi không thể xử lý tệp này.",
                  sender: "ai",
                },
              ]);
              scrollToBottom();
            }

            // Display products if available
            if (productList && productList.length > 0) {
              const aiProductsMsgId = `ai-products-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: aiProductsMsgId,
                  type: "products",
                  content: "",
                  sender: "ai",
                  products: productList,
                },
              ]);
              scrollToBottom();
            }
          } else {
            // Fallback for missing data
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-error-${Date.now()}`,
                type: "text",
                content: "Xin lỗi, đã xảy ra lỗi khi xử lý tệp.",
                sender: "ai",
              },
            ]);
            scrollToBottom();
          }
        } catch (error) {
          console.error("Error sending document to AI:", error);
          // Show user-friendly error
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-error-${Date.now()}`,
              type: "text",
              content: "Xin lỗi, đã xảy ra lỗi khi gửi tệp. Vui lòng thử lại.",
              sender: "ai",
            },
          ]);
          scrollToBottom();
        } finally {
          setIsLoading(false);
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
      alert("Failed to pick document");
    }
  };

  const LoadingDots = () => {
    const [dots, setDots] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return (
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Image
          source={require("@/assets/ai-avatar.png")}
          style={{
            width: 30,
            height: 30,
            marginRight: 8,
          }}
        />
        <View
          style={{
            backgroundColor: "#f0f2ff",
            padding: 12,
            borderRadius: 16,
            borderBottomLeftRadius: 4,
          }}
        >
          <Text style={{ color: "#000", fontSize: 16 }}>
            {`Đang nhập${dots}`}
          </Text>
        </View>
      </View>
    );
  };

  // Hàm để cuộn xuống cuối
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    // Clear input
    setInputText("");
    const userMsgId = `user-${Date.now()}`;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: "text",
        content: inputText,
        sender: "user",
      },
    ]);

    setIsLoading(true); // Show loading animation
    scrollToBottom(); // Cuộn xuống sau khi thêm tin nhắn mới

    try {
      // Call API with user_id from context
      const user_id = appState?.user?._id || "1"; // Fallback to "1" if user not found
      const response = await chatWithAI(user_id, "1", inputText);

      // Parse the response data - cấu trúc thực tế từ API
      const apiData = response as ApiResponse;
      console.log("Raw API response:", JSON.stringify(apiData));

      // Trích xuất dữ liệu từ cấu trúc lồng nhau
      const responseText = apiData.response?.response || "";
      const productList = apiData.response?.products || [];

      console.log("Extracted response text:", responseText);
      console.log("Extracted products:", JSON.stringify(productList));

      // Hiển thị response text nếu có
      if (responseText) {
        const aiMsgId = `ai-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            type: "text",
            content: responseText,
            sender: "ai",
          },
        ]);
        scrollToBottom(); // Cuộn xuống sau khi nhận phản hồi text
      }

      // Hiển thị sản phẩm nếu có
      if (productList && productList.length > 0) {
        const aiProductsMsgId = `ai-products-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: aiProductsMsgId,
            type: "products",
            content: "",
            sender: "ai",
            products: productList,
          },
        ]);
        scrollToBottom(); // Cuộn xuống sau khi hiển thị sản phẩm
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error message to user
    } finally {
      setIsLoading(false); // Hide loading animation
      scrollToBottom(); // Cuộn xuống sau khi hoàn thành
    }
  };

  const renderOptionsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showOptions}
      onRequestClose={() => setShowOptions(false)}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={() => setShowOptions(false)}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 15,
              top: 15,
              zIndex: 1,
            }}
            onPress={() => setShowOptions(false)}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
              marginTop: 10,
            }}
            onPress={() => {
              setShowOptions(false);
              takePicture();
            }}
          >
            <MaterialIcons
              name="camera-alt"
              size={24}
              color={APP_COLOR.ORANGE}
            />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Chụp Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => {
              setShowOptions(false);
              pickImage();
            }}
          >
            <MaterialIcons name="photo" size={24} color={APP_COLOR.ORANGE} />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Đính Kèm Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => {
              setShowOptions(false);
              pickDocument();
            }}
          >
            <MaterialIcons
              name="attach-file"
              size={24}
              color={APP_COLOR.ORANGE}
            />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Đính Kèm Tệp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderMessage = (msg: any, index: number) => {
    if (
      msg.type === "products" &&
      Array.isArray(msg.products) &&
      msg.products.length > 0
    ) {
      return (
        <View key={msg.id} style={{ marginBottom: 20 }}>
          <ProductResults products={msg.products} />
        </View>
      );
    }

    if (msg.type === "image") {
      return (
        <View
          key={msg.id}
          style={{
            flexDirection: "row",
            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            marginBottom: 30,
            alignItems: "flex-start",
          }}
        >
          {msg.sender === "ai" && (
            <Image
              source={require("@/assets/ai-avatar.png")}
              style={{
                width: 30,
                height: 30,
                marginRight: 8,
              }}
            />
          )}

          <View
            style={{
              maxWidth: "70%",
              backgroundColor:
                msg.sender === "user" ? APP_COLOR.ORANGE : "#f0f2ff",
              padding: 12,
              borderRadius: 16,
              borderBottomRightRadius: msg.sender === "user" ? 4 : 16,
              borderBottomLeftRadius: msg.sender === "ai" ? 4 : 16,
            }}
          >
            <Image
              source={{ uri: msg.content }}
              style={{
                width: 200,
                height: 200,
                borderRadius: 8,
              }}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    return (
      <View
        key={msg.id}
        style={{
          flexDirection: "row",
          justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
          marginBottom: 30,
          alignItems: "flex-start",
        }}
      >
        {msg.sender === "ai" && (
          <Image
            source={require("@/assets/ai-avatar.png")}
            style={{
              width: 30,
              height: 30,
              marginRight: 8,
            }}
          />
        )}

        <View
          style={{
            maxWidth: "70%",
            backgroundColor:
              msg.sender === "user" ? APP_COLOR.ORANGE : "#f0f2ff",
            padding: 12,
            borderRadius: 16,
            borderBottomRightRadius: msg.sender === "user" ? 4 : 16,
            borderBottomLeftRadius: msg.sender === "ai" ? 4 : 16,
          }}
        >
          <Text
            style={{
              color: msg.sender === "user" ? "#fff" : "#000",
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          paddingBottom: isKeyboardVisible ? 0 : 60,
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/ai-avatar.png")}
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text style={{ fontSize: 18, fontWeight: "500" }}>Trợ lý AI</Text>
        </View>
        {/* AI Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 15 }}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {messages.map((msg, index) => renderMessage(msg, index))}
          {isLoading && <LoadingDots />}
        </ScrollView>
        {/* Input Area */}
        <View
          style={{
            padding: 15,
            borderTopWidth: 1,
            borderTopColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowOptions(true)}
            style={{ marginRight: 10 }}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={24}
              color={APP_COLOR.ORANGE}
            />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập nội dung chat"
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
              borderRadius: 20,
            }}
          />
          <TouchableOpacity
            style={{ marginLeft: 10 }}
            onPress={handleSendMessage}
          >
            <MaterialIcons name="send" size={24} color={APP_COLOR.ORANGE} />
          </TouchableOpacity>
        </View>
      </View>

      {renderOptionsModal()}
    </SafeAreaView>
  );
};

export default AIChatPage;

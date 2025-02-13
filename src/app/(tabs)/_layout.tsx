import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { APP_COLOR } from "@/utils/constants";
import React, { useState, useEffect } from "react";
import { Keyboard, Platform } from "react-native";

const TabLayout = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

  const getIcons = (routeName: string, focused: boolean, size: number) => {
    if (routeName === "index") {
      return (
        <MaterialCommunityIcons
          name="food-fork-drink"
          size={size}
          color={focused ? APP_COLOR.ORANGE : APP_COLOR.GREY}
        />
      );
    }
    // if (routeName === "order") {
    //   return (
    //     <MaterialIcons
    //       name="list-alt"
    //       size={size}
    //       color={focused ? APP_COLOR.ORANGE : APP_COLOR.GREY}
    //     />
    //   );
    // }
    if (routeName === "ai-chat") {
      return (
        <MaterialCommunityIcons
          name="chat-processing"
          size={size}
          color={focused ? APP_COLOR.ORANGE : APP_COLOR.GREY}
        />
      );
    }

    if (routeName === "favorite") {
      return focused ? (
        <AntDesign name="heart" size={size} color={APP_COLOR.ORANGE} />
      ) : (
        <AntDesign name="hearto" size={size} color={APP_COLOR.GREY} />
      );
    }

    if (routeName === "notification") {
      return focused ? (
        <Octicons name="bell-fill" size={size} color={APP_COLOR.ORANGE} />
      ) : (
        <Octicons name="bell" size={size} color={APP_COLOR.GREY} />
      );
    }

    if (routeName === "account") {
      return focused ? (
        <MaterialCommunityIcons
          name="account"
          size={size}
          color={APP_COLOR.ORANGE}
        />
      ) : (
        <MaterialCommunityIcons
          name="account-outline"
          size={size}
          color={APP_COLOR.GREY}
        />
      );
    }

    return <></>;
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          return getIcons(route.name, focused, size);
        },
        headerShown: false,
        tabBarLabelStyle: { paddingBottom: 3 },
        tabBarActiveTintColor: APP_COLOR.ORANGE,
        tabBarStyle: {
          display: isKeyboardVisible ? "none" : "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: "white",
          height: 60,
          zIndex: 1000,
        },
      })}
      // sceneContainerStyle={{ backgroundColor: "#fff" }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      {/* <Tabs.Screen
        name="order"
        options={{
          title: "Đơn hàng",
        }}
      /> */}
      <Tabs.Screen
        name="favorite"
        options={{
          title: "Đã thích",
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI chat",
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Thông báo",
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Tôi",
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

import { Package, ShoppingCart } from "lucide-react-native";
import React from "react";
import { Button, Text, XStack, useTheme } from "tamagui";
import { ORDER_TAB, type OrderTabType } from "../types/enums";

// ============================================================================
// Types
// ============================================================================

interface OrdersTabSelectorProps {
  /** Currently active tab */
  activeTab: OrderTabType;
  /** Callback when tab changes */
  onTabChange: (tab: OrderTabType) => void;
}

// ============================================================================
// OrdersTabSelector Component
// ============================================================================

/**
 * Tab selector for switching between Orders and Products views.
 *
 * Features:
 * - Two tabs: Orders / Products
 * - Active state with gold background
 * - Icons for visual clarity
 */
export const OrdersTabSelector: React.FC<OrdersTabSelectorProps> = ({
  activeTab,
  onTabChange,
}) => {
  const theme = useTheme();

  return (
    <XStack paddingHorizontal="$3" paddingTop="$3" gap="$2">
      <Button
        flex={1}
        size="$2"
        backgroundColor={
          activeTab === ORDER_TAB.ORDERS ? "$chineseGold" : "$softGrayLighter"
        }
        pressStyle={{
          scale: 0.95,
          backgroundColor:
            activeTab === ORDER_TAB.ORDERS
              ? "$chineseGold"
              : "$softGrayLighter",
        }}
        onPress={() => onTabChange(ORDER_TAB.ORDERS)}
        icon={
          <ShoppingCart
            size={16}
            color={
              activeTab === ORDER_TAB.ORDERS
                ? theme.pearlWhite?.val
                : theme.softGray?.val
            }
            pointerEvents="none"
          />
        }
      >
        <Text
          color={activeTab === ORDER_TAB.ORDERS ? "$pearlWhite" : "$softGray"}
          fontWeight="600"
        >
          {t("ordersTabOrders")}
        </Text>
      </Button>

      <Button
        flex={1}
        size="$2"
        backgroundColor={
          activeTab === ORDER_TAB.PRODUCTS ? "$chineseGold" : "$softGrayLighter"
        }
        pressStyle={{
          scale: 0.95,
          backgroundColor:
            activeTab === ORDER_TAB.PRODUCTS
              ? "$chineseGold"
              : "$softGrayLighter",
        }}
        onPress={() => onTabChange(ORDER_TAB.PRODUCTS)}
        icon={
          <Package
            size={16}
            color={
              activeTab === ORDER_TAB.PRODUCTS
                ? theme.pearlWhite?.val
                : theme.softGray?.val
            }
            pointerEvents="none"
          />
        }
      >
        <Text
          color={activeTab === ORDER_TAB.PRODUCTS ? "$pearlWhite" : "$softGray"}
          fontWeight="600"
        >
          {t("ordersTabProducts")}
        </Text>
      </Button>
    </XStack>
  );
};

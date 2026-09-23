import { useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, Text, YStack, useTheme } from "tamagui";
import { Header, HeaderTitle } from "@/modules/core/components";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import { OrderCardUser, useMemberOrders } from "@/modules/orders";
import { useStore } from "@/store";

/**
 * User Orders Screen
 *
 * Route: /user/orders
 *
 * Displays the current user's orders as a simple list of OrderCards.
 * Read-only — no create/edit functionality.
 */
export default function UserOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const insets = useSafeAreaInsets();

  const { orders, isLoading } = useMemberOrders(schoolMembership?.memberId);

  if (!schoolMembership) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("ordersTitle")} />} />
        <YStack flex={1} padding="$6" alignItems="center" justifyContent="center">
          <Text fontSize="$5" color="$gray11" textAlign="center">{t("pendingMembershipInfo")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("ordersTitle")} />}
      />

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" />
        </YStack>
      ) : orders.length === 0 ? (
        <YStack
          flex={1}
          padding="$6"
          gap="$2"
          alignItems="center"
          justifyContent="center"
        >
          <ShoppingCart size={48} color={theme.softGray?.val} />
          <Text fontSize="$5" color="$softGray" textAlign="center">
            {t("emptyNoOrders")}
          </Text>
        </YStack>
      ) : (
        <ScrollView>
          <YStack gap="$2" paddingVertical="$3">
            {orders.map(
              (item) => (
                console.log(
                  "Rendering order:",
                  item.order.id,
                  "with details:",
                  item,
                ),
                (
                  <OrderCardUser
                    key={item.order.id}
                    displayName={
                      item.itemCount === 1
                        ? (item.productName ?? "")
                        : `${item.itemCount} ${t("items")}`
                    }
                    status={item.order.status}
                    totalsByCurrency={item.totalsByCurrency}
                    createdAt={item.order.createdAt}
                    onPress={() =>
                      router.push(`/user/orders/${item.order.id}` as never)
                    }
                  />
                )
              ),
            )}
          </YStack>
        </ScrollView>
      )}
      <OptionsSheet
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
        action={() => router.push("/user/orders/create" as never)}
      />
    </View>
  );
}

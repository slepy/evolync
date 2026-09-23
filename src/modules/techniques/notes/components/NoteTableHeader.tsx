import { View } from "react-native";
import { Text, XStack } from "tamagui";

export function NoteTableHeader() {
  return (
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      backgroundColor="$backgroundStrong"
    >
      <Text
        flex={1}
        fontSize="$2"
        fontWeight="600"
        color="$softGrayDark"
        textAlign="center"
      >
        {t("notesPerson1")}
      </Text>
      <Text
        flex={1}
        fontSize="$2"
        fontWeight="600"
        color="$softGrayDark"
        textAlign="center"
      >
        {t("notesDirection")}
      </Text>
      <Text
        flex={1}
        fontSize="$2"
        fontWeight="600"
        color="$softGrayDark"
        textAlign="center"
      >
        {t("notesPerson2")}
      </Text>
      <View style={{ width: 32 }} />
    </XStack>
  );
}

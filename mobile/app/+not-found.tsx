import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/layout/screen";
import { EmptyState } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: uz.errors.notFound }} />
      <Screen topInset={false}>
        <EmptyState
          title={uz.errors.notFound}
          actionLabel={uz.common.back}
          onAction={() => router.replace("/")}
        />
      </Screen>
    </>
  );
}

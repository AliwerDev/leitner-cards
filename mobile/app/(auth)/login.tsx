import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Input, Text } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { useAuth } from "@/lib/auth/session-context";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { loginSchema } from "@/lib/validation/auth";

export default function LoginScreen() {
  const { space } = useTheme();
  const { signIn } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  /**
   * `fieldOnUnauthorized: "password"` matches what the web does in its login
   * action. The backend answers a wrong password with a 401 carrying no
   * `fields`, so without this the only feedback would be a banner above a form
   * that looks untouched.
   */
  const form = useForm({
    schema: loginSchema,
    onSubmit: (values) => signIn(values.login, values.password),
    fieldOnUnauthorized: "password",
  });

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, justifyContent: "center", gap: space.md }}>
      <View style={{ gap: space["2xs"], marginBottom: space.sm }}>
        <Text variant="title">{uz.auth.loginTitle}</Text>
        <Text variant="body" tone="muted">
          {uz.auth.loginSubtitle}
        </Text>
      </View>

      {form.message ? <Alert tone="danger" message={form.message} /> : null}

      <Input
        label={uz.auth.loginField}
        value={login}
        onChangeText={setLogin}
        error={form.fields.login}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
      />

      <Input
        label={uz.auth.password}
        value={password}
        onChangeText={setPassword}
        error={form.fields.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void form.submit({ login, password })}
      />

      <Button
        label={uz.auth.loginSubmit}
        block
        loading={form.submitting}
        onPress={() => void form.submit({ login, password })}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", gap: space["2xs"] }}>
        <Text variant="body" tone="muted">
          {uz.auth.noAccount}
        </Text>
        <Link href="/register">
          <Text variant="bodyStrong" tone="accent">
            {uz.auth.registerSubmit}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

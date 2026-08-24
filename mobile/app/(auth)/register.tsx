import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Input, Text } from "@/components/ui";
import { useForm } from "@/hooks/use-form";
import { useAuth } from "@/lib/auth/session-context";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import { registerSchema } from "@/lib/validation/auth";

export default function RegisterScreen() {
  const { space } = useTheme();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const form = useForm({
    schema: registerSchema,
    onSubmit: (values) => signUp(values.username, values.email, values.password),
  });

  const values = { username, email, password, passwordConfirm };

  return (
    <Screen scroll contentStyle={{ flexGrow: 1, justifyContent: "center", gap: space.md }}>
      <View style={{ gap: space["2xs"], marginBottom: space.sm }}>
        <Text variant="title">{uz.auth.registerTitle}</Text>
        <Text variant="body" tone="muted">
          {uz.auth.registerSubtitle}
        </Text>
      </View>

      {form.message ? <Alert tone="danger" message={form.message} /> : null}

      <Input
        label={uz.auth.username}
        value={username}
        onChangeText={setUsername}
        error={form.fields.username}
        hint={uz.auth.usernameHint}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
      />

      <Input
        label={uz.auth.email}
        value={email}
        onChangeText={setEmail}
        error={form.fields.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <Input
        label={uz.auth.password}
        value={password}
        onChangeText={setPassword}
        error={form.fields.password}
        hint={uz.auth.passwordHint}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
      />

      <Input
        label={uz.auth.passwordConfirm}
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        error={form.fields.passwordConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        returnKeyType="go"
        onSubmitEditing={() => void form.submit(values)}
      />

      <Button
        label={uz.auth.registerSubmit}
        block
        loading={form.submitting}
        onPress={() => void form.submit(values)}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", gap: space["2xs"] }}>
        <Text variant="body" tone="muted">
          {uz.auth.hasAccount}
        </Text>
        <Link href="/login">
          <Text variant="bodyStrong" tone="accent">
            {uz.auth.loginSubmit}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth/session-context";

/**
 * The entry route. Sends the user to whichever half of the app they belong in.
 *
 * The root layout's Stack.Protected already prevents reaching the wrong group,
 * so this only has to pick a landing screen rather than enforce anything.
 */
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? "/decks" : "/login"} />;
}

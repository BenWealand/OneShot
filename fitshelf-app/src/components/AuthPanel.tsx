import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ensureSupabaseProfile, getAuthRedirectUrl, handleSupabaseAuthCallback, isSupabaseConfigured, supabase } from "../lib/supabase";
import type { UserSession } from "../types/models";

type Props = {
  onSession: (session: UserSession) => void;
};

export function AuthPanel({ onSession }: Props) {
  const [email, setEmail] = useState("demo@fitshelf.local");
  const [password, setPassword] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(isSupabaseConfigured ? "Sign in or create an account." : "Supabase env is missing. Demo mode is available.");
  const redirectUrl = getAuthRedirectUrl();

  const useDemo = () => {
    onSession({ id: "demo-user", email: "demo@fitshelf.local", mode: "demo" });
  };

  const submit = async (mode: "signIn" | "signUp") => {
    if (!supabase) {
      useDemo();
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      setStatus("Enter an email and a password with at least 6 characters.");
      return;
    }
    setBusy(true);
    const result =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: redirectUrl
            }
          });
    if (result.error) {
      setBusy(false);
      const message = result.error.message.includes("Email not confirmed")
        ? "Email confirmation is required. Check your inbox, then sign in again."
        : result.error.message;
      setStatus(message);
      Alert.alert("Authentication failed", message);
      return;
    }
    if (mode === "signUp" && result.data.user && !result.data.session) {
      setBusy(false);
      setStatus(`Email confirmation required. Open the verification link on this device. Redirect: ${redirectUrl}`);
      Alert.alert("Check your email", "Open the verification link on this device. It should return to FitShelf automatically.");
      return;
    }
    const user = result.data.user;
    if (user?.email) {
      const profile = await ensureSupabaseProfile();
      setBusy(false);
      if (profile.error || !profile.userId) {
        setStatus(profile.error ?? "Signed in, but profile creation failed.");
        return;
      }
      setStatus("Signed in. Profile is ready.");
      onSession({ id: profile.userId, email: profile.email ?? user.email, mode: "supabase" });
    } else if (mode === "signUp") {
      setBusy(false);
      setStatus(`Email confirmation required. Open the verification link on this device. Redirect: ${redirectUrl}`);
      Alert.alert("Check your email", "Open the verification link on this device. It should return to FitShelf automatically.");
    } else {
      setBusy(false);
    }
  };

  const recoverCallback = async () => {
    if (!supabase) {
      useDemo();
      return;
    }
    const url = callbackUrl.trim();
    if (!url) {
      setStatus("Paste the full verification callback URL, then tap Restore callback.");
      return;
    }
    setBusy(true);
    const result = await handleSupabaseAuthCallback(url);
    setStatus(result.message);
    if (!result.ok) {
      setBusy(false);
      return;
    }
    const profile = await ensureSupabaseProfile();
    setBusy(false);
    if (profile.error || !profile.userId) {
      setStatus(profile.error ?? "Callback restored a session, but profile creation failed.");
      return;
    }
    onSession({ id: profile.userId, email: profile.email ?? email.trim().toLowerCase(), mode: "supabase" });
  };

  const checkExistingSession = async () => {
    if (!supabase) {
      useDemo();
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setBusy(false);
      setStatus(`Session check failed: ${error.message}`);
      return;
    }
    const user = data.session?.user;
    if (!user?.email) {
      setBusy(false);
      setStatus("No app session found. Paste the full verification callback URL if email did not reopen FitShelf.");
      return;
    }
    const profile = await ensureSupabaseProfile();
    setBusy(false);
    if (profile.error || !profile.userId) {
      setStatus(profile.error ?? "Session found, but profile creation failed.");
      return;
    }
    setStatus("Session recovered. Profile is ready.");
    onSession({ id: profile.userId, email: profile.email ?? user.email, mode: "supabase" });
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>FitShelf</Text>
      <Text style={styles.subtitle}>{isSupabaseConfigured ? "Supabase mode" : "Local demo mode"}</Text>
      <Text style={styles.status}>{status}</Text>
      {isSupabaseConfigured ? <Text style={styles.redirect}>Redirect: {redirectUrl}</Text> : null}
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
      {isSupabaseConfigured ? (
        <View style={styles.callbackBox}>
          <TextInput
            style={styles.callbackInput}
            value={callbackUrl}
            onChangeText={setCallbackUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Paste verification callback URL"
          />
          <Pressable style={styles.callbackButton} disabled={busy} onPress={() => void recoverCallback()}>
            <Text style={styles.callbackButtonText}>Restore callback</Text>
          </Pressable>
          <Pressable style={styles.callbackButton} disabled={busy} onPress={() => void checkExistingSession()}>
            <Text style={styles.callbackButtonText}>Check session</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        <Pressable style={styles.primary} disabled={busy} onPress={() => void submit("signIn")}>
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>
        <Pressable style={styles.secondary} disabled={busy} onPress={() => void submit("signUp")}>
          <Text style={styles.secondaryText}>Sign up</Text>
        </Pressable>
      </View>
      <Pressable style={styles.demo} onPress={useDemo}>
        <Text style={styles.demoText}>Continue in demo mode</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 14, padding: 20 },
  title: { fontSize: 36, fontWeight: "800", color: "#222831" },
  subtitle: { fontSize: 14, color: "#69707d" },
  status: { color: "#58606d", fontSize: 12, fontWeight: "700" },
  redirect: { color: "#69707d", fontSize: 11, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#d9dde5", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  callbackBox: { backgroundColor: "#f7f9fa", borderColor: "#d9dde5", borderRadius: 8, borderWidth: 1, gap: 8, padding: 8 },
  callbackInput: { backgroundColor: "#fff", borderColor: "#d9dde5", borderRadius: 8, borderWidth: 1, color: "#222831", padding: 10 },
  callbackButton: { alignItems: "center", borderColor: "#2f6f73", borderRadius: 8, borderWidth: 1, padding: 10 },
  callbackButtonText: { color: "#2f6f73", fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  primary: { flex: 1, backgroundColor: "#2f6f73", padding: 13, borderRadius: 8, alignItems: "center" },
  secondary: { flex: 1, borderWidth: 1, borderColor: "#2f6f73", padding: 13, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryText: { color: "#2f6f73", fontWeight: "700" },
  demo: { padding: 12, alignItems: "center" },
  demoText: { color: "#58606d", fontWeight: "600" }
});

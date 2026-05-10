import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { UserSession } from "../types/models";

type Props = {
  onSession: (session: UserSession) => void;
};

export function AuthPanel({ onSession }: Props) {
  const [email, setEmail] = useState("demo@fitshelf.local");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const useDemo = () => {
    onSession({ id: "demo-user", email: "demo@fitshelf.local", mode: "demo" });
  };

  const submit = async (mode: "signIn" | "signUp") => {
    if (!supabase) {
      useDemo();
      return;
    }
    setBusy(true);
    const result =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      Alert.alert("Authentication failed", result.error.message);
      return;
    }
    const user = result.data.user;
    if (user?.email) {
      onSession({ id: user.id, email: user.email, mode: "supabase" });
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>FitShelf</Text>
      <Text style={styles.subtitle}>{isSupabaseConfigured ? "Supabase mode" : "Local demo mode"}</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
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
  input: { borderWidth: 1, borderColor: "#d9dde5", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  row: { flexDirection: "row", gap: 10 },
  primary: { flex: 1, backgroundColor: "#2f6f73", padding: 13, borderRadius: 8, alignItems: "center" },
  secondary: { flex: 1, borderWidth: 1, borderColor: "#2f6f73", padding: 13, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryText: { color: "#2f6f73", fontWeight: "700" },
  demo: { padding: 12, alignItems: "center" },
  demoText: { color: "#58606d", fontWeight: "600" }
});

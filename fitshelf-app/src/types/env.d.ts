declare const process: {
  env: {
    EXPO_PUBLIC_FITSHELF_BACKEND_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};
declare module "*.glb" {
  const value: number;
  export default value;
}

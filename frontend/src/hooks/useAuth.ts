import { useAuthContext } from "@/features/auth/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  return useAuthContext();
}

export function useCurrentUser() {
  const { user, isInitialized, refreshUser } = useAuthContext();
  
  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!user) return null;
      return user;
    },
    enabled: isInitialized,
    initialData: user,
  });

  return {
    ...query,
    user: query.data || user,
    refreshUser,
  };
}

export function useLogin() {
  const { login } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useRegister() {
  const { register } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["currentUser"], null);
      queryClient.invalidateQueries();
    },
  });
}

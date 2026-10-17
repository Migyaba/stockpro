import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrganizationProfile,
  updateOrganizationProfile,
  fetchOrganizationMembers,
  inviteOrganizationMember,
  toggleMemberActive,
  fetchPendingInvitations,
  revokeInvitation,
  updateMember,
  fetchPermissionCatalog,
} from "@/lib/api/organization";
import type {
  Organization,
  InviteMemberPayload,
  OrganizationMember,
  UpdateMemberPayload,
} from "@/lib/types/api";

export const orgQueryKeys = {
  profile: ["organization", "profile"] as const,
  members: ["organization", "members"] as const,
  invitations: ["organization", "invitations"] as const,
  permissionCatalog: ["organization", "permission-catalog"] as const,
};

/** Permissions par rôle et permissions ajustables (fixes côté serveur). */
export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.permissionCatalog,
    queryFn: () => fetchPermissionCatalog(),
    staleTime: Infinity,
    enabled,
  });
}

export function useOrganizationProfile() {
  return useQuery({
    queryKey: orgQueryKeys.profile,
    queryFn: () => fetchOrganizationProfile(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateOrganizationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Organization>) =>
      updateOrganizationProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.profile });
    },
  });
}

export function useOrganizationMembers() {
  return useQuery({
    queryKey: orgQueryKeys.members,
    queryFn: () => fetchOrganizationMembers(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => inviteOrganizationMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.invitations });
    },
  });
}

export function useToggleMemberActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleMemberActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.members });
    },
  });
}

export function usePendingInvitations(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.invitations,
    queryFn: fetchPendingInvitations,
    enabled,
    staleTime: 60_000,
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgQueryKeys.invitations }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMemberPayload }) =>
      updateMember(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgQueryKeys.members }),
  });
}

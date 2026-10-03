import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrganizationProfile,
  updateOrganizationProfile,
  fetchOrganizationMembers,
  inviteOrganizationMember,
  updateMemberRole,
  toggleMemberActive,
} from "@/lib/api/organization";
import type {
  Organization,
  InviteMemberPayload,
  OrganizationMember,
} from "@/lib/types/api";

export const orgQueryKeys = {
  profile: ["organization", "profile"] as const,
  members: ["organization", "members"] as const,
};

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
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.members });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: number;
      role: OrganizationMember["role"];
    }) => updateMemberRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.members });
    },
  });
}

export function useToggleMemberActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleMemberActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.members });
    },
  });
}

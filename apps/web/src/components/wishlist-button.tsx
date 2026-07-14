"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/format";

interface WishlistButtonProps {
  catalogItemId: string;
  className?: string;
  redirectOnAdd?: boolean;
  label?: string;
}

export function WishlistButton({
  catalogItemId,
  className,
  redirectOnAdd = true,
  label,
}: WishlistButtonProps) {
  const { session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["wishlist-check", catalogItemId, session?.userId],
    queryFn: () => api.get<{ wishlisted: boolean }>(`/collection/wishlist/check/${catalogItemId}`, true),
    enabled: Boolean(session),
  });

  const toggle = useMutation({
    mutationFn: () =>
      api.post<{ wishlisted: boolean }>("/collection/wishlist/toggle", { catalogItemId }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wishlist-check", catalogItemId] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      if (res.wishlisted && redirectOnAdd) {
        router.push("/account/wishlist");
      }
    },
  });

  const wishlisted = data?.wishlisted ?? false;

  return (
    <button
      type="button"
      className={cn(
        "btn-outline flex-1",
        wishlisted && "border-gold/40 bg-gold/5 text-gold",
        className,
      )}
      disabled={toggle.isPending}
      onClick={() => {
        if (!session) {
          router.push("/sign-in");
          return;
        }
        toggle.mutate();
      }}
    >
      <Heart size={16} className={wishlisted ? "fill-current" : ""} />
      {label ?? (wishlisted ? "ในรายการโปรด" : "เพิ่มในรายการโปรด")}
    </button>
  );
}


"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useFindUsers,
  useUpdateModerators,
  useUserById,
} from "@/backend-calls";
import { UserProfile, tournamentBody } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Search, Trash, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";

interface ModeratorProps {
  userId: string;
  onRemove: (userId: string) => void;
  isPending: boolean;
}

const ModeratorItem = ({ userId, onRemove, isPending }: ModeratorProps) => {
  const { data: user, isLoading } = useUserById(userId);

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL ?? ""} />
          <AvatarFallback>
            {user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{user?.displayName ?? user?.email}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(userId)}
        disabled={isPending}
      >
        <Trash className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export function ManageModeratorsForm({
  tournament,
}: {
  tournament: tournamentBody;
}) {
  const t = useTranslations("forms.tournament");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: searchResults, isLoading: isSearching } = useFindUsers(
    debouncedSearchTerm,
  );

  const { mutate: updateModerators, isPending: isUpdating } =
    useUpdateModerators({ tournamentId: tournament.id! });

  const handleAddModerator = (userId: string) => {
    updateModerators({ userId, action: "add" });
  };

  const handleRemoveModerator = (userId: string) => {
    updateModerators({ userId, action: "remove" });
  };

  const currentModeratorIds = tournament.moderators ?? [];
  const ownerId = tournament.createdBy;

  const filteredResults = searchResults?.filter(
    (user) => !currentModeratorIds.includes(user.id) && user.id !== ownerId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t.rich("current-moderators")}</h3>
        <Separator className="my-2" />
        {currentModeratorIds.length > 0 ? (
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {currentModeratorIds.map((modId) => (
                <ModeratorItem
                  key={modId}
                  userId={modId}
                  onRemove={handleRemoveModerator}
                  isPending={isUpdating}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no-moderators")}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium">{t("add-moderator")}</h3>
        <Separator className="my-2" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search-by-email")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mt-4 space-y-2">
          {isSearching && <Loader2 className="mx-auto animate-spin" />}
          {filteredResults && filteredResults.length > 0 ? (
            filteredResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ""} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) ?? user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.displayName ?? user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleAddModerator(user.id)}
                  disabled={isUpdating}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : debouncedSearchTerm && !isSearching ? (
            <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-muted-foreground">
              <UserX className="mb-2 h-8 w-8" />
              <p>{t("no-users-found")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

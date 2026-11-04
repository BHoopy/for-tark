
"use client";
import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Loader2, MoreVertical, Search, Share, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import allTeams from "@/lib/teams.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditTeamDialog } from "@/components/forms/edit-team-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { teamBody } from "@/types/types";
import {
  useAddTeam,
  useDeleteTeam,
  useUpdateTeam,
  useSaveTeamList,
  useAddMultipleTeams,
  useFetchTeamLists,
  useTournamentsById,
  useDeleteTeamList,
} from "@/backend-calls";
import { useParams } from "next/navigation";
import {
  collection,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import { app } from "@/lib/firebase/firebase";
import PulseLoader from "@/components/ui/pulse-loader";
import { UserNav } from "@/components/navbar/user-nav";
import Footer from "@/components/ui/footer";
import DonationBanner from "@/components/ui/donation-banner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { toDataURL } from "@/lib/toDataURL";

const addTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(50, "Team name must not exceed 50 characters"),
});

const saveTeamListSchema = z.object({
  listName: z.string().min(1, "List name is required"),
});

export default function TeamsPage() {
  const t = useTranslations();
  const { id } = useParams();
  const tournamentId = Array.isArray(id) ? id[0] : id;
  const locale = useLocale();
  const { user } = useUser();

  const [teams, setTeams] = useState<teamBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<"preset" | "custom">("preset");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<teamBody | null>(null);
  const [saveListDialogOpen, setSaveListDialogOpen] = useState(false);
  const [loadListDialogOpen, setLoadListDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: tournament } = useTournamentsById({ id: tournamentId });
  const addTeamMutation = useAddTeam({ tournamentId });
  const updateTeamMutation = useUpdateTeam({ tournamentId });
  const deleteTeamMutation = useDeleteTeam({ tournamentId });
  const saveTeamListMutation = useSaveTeamList();
  const addMultipleTeamsMutation = useAddMultipleTeams({ tournamentId });

  const { data: savedTeamLists, isLoading: isLoadingTeamLists } =
    useFetchTeamLists(user?.uid);
  const deleteTeamListMutation = useDeleteTeamList();

  const db = getFirestore(app);

  React.useEffect(() => {
    if (!tournamentId) return;
    setLoading(true);
    const teamsCol = collection(db, "tournaments", tournamentId, "teams");
    const unsubscribe = onSnapshot(teamsCol, (snapshot) => {
      const teamsList = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as teamBody,
      );
      setTeams(teamsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId, db]);

  const addTeamForm = useForm({
    resolver: zodResolver(addTeamSchema),
    defaultValues: { name: "" },
  });

  const saveTeamListForm = useForm({
    resolver: zodResolver(saveTeamListSchema),
    defaultValues: { listName: "" },
  });

  const filteredPresetTeams = useMemo(() => {
    return allTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !teams.some((t) => t.name === team.name),
    );
  }, [searchQuery, teams]);

  const onAddCustomTeam = (values: z.infer<typeof addTeamSchema>) => {
    addTeamMutation.mutate(
      { name: values.name, logo: "/Play.png" },
      { onSuccess: () => addTeamForm.reset({ name: "" }) },
    );
  };

  const onAddPresetTeam = (team: {
    id: number;
    name: string;
    logo: string;
  }) => {
    addTeamMutation.mutate({ name: team.name, logo: team.logo });
  };

  const onUpdateTeam = (values: any) => {
    const teamToUpdate = {
      ...values,
      roster:
        typeof values.roster === "string"
          ? values.roster.split(",").map((s: string) => s.trim())
          : [],
    };
    updateTeamMutation.mutate(teamToUpdate, {
      onSuccess: () => setEditingTeam(null),
    });
  };

  const onDeleteTeam = (teamId: string) => {
    deleteTeamMutation.mutate(teamId, {
      onSuccess: () => setEditingTeam(null),
    });
  };

  const onSaveTeamList = (values: z.infer<typeof saveTeamListSchema>) => {
    if (!user) return;
    const teamData = teams.map(({ name, logo }) => ({ name, logo: logo! }));
    saveTeamListMutation.mutate(
      { userId: user.uid, listName: values.listName, teams: teamData },
      {
        onSuccess: () => {
          saveTeamListForm.reset();
          setSaveListDialogOpen(false);
        },
      },
    );
  };

  const handleLoadList = (teamList: any) => {
    addMultipleTeamsMutation.mutate(teamList.teams, {
      onSuccess: () => {
        setLoadListDialogOpen(false);
      },
    });
  };
  const handleDeleteList = (listId: string) => {
    if (!user) return;
    deleteTeamListMutation.mutate({ userId: user.uid, listId });
  };
  const exportTeamsToImage = async () => {
    if (!tournament) return;
    setIsExporting(true);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const colWidth = 300;
    const numCols = 4;
    const padding = 40; // Increased padding for more vertical space
    const headerHeight = 80;
    const teamRowHeight = 120;
    const canvasWidth = numCols * colWidth + (numCols + 1) * padding;

    const teamHeights = await Promise.all(
      teams.map(async (team) => {
        let teamHeight = 90; // Increased base height for logo and name
        if (team.roster && team.roster.length > 0) {
          teamHeight += 20; // Initial space for roster title
          team.roster.forEach(() => (teamHeight += 25)); // Increased space per player
        }
        return teamHeight;
      }),
    );

    let colHeights = [headerHeight, headerHeight, headerHeight, headerHeight];
    const teamPositions: { x: number; y: number; height: number }[] = [];

    teamHeights.forEach((h) => {
      let minH = Math.min(...colHeights);
      let minI = colHeights.indexOf(minH);
      teamPositions.push({
        x: minI * (colWidth + padding) + padding,
        y: minH,
        height: h,
      });
      colHeights[minI] += h + padding;
    });

    canvas.height = Math.max(...colHeights);
    canvas.width = canvasWidth;

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tournament.name, canvas.width / 2, 50);

    const logoPromises = teams.map((team) =>
      toDataURL(team.logo || "/Play.png"),
    );
    const logoDataUrls = await Promise.all(logoPromises);
    const logos = await Promise.all(
      logoDataUrls.map((url) => {
        const img = document.createElement("img");
        img.src = url as string;
        return new Promise<HTMLImageElement>((resolve) => {
          img.onload = () => resolve(img);
        });
      }),
    );

    teams.forEach((team, index) => {
      const { x, y } = teamPositions[index];
      let currentY = y;

      // Draw Logo
      const logo = logos[index];
      if (logo) {
        ctx.drawImage(logo, x + (colWidth - 80) / 2, currentY + 10, 80, 80);
      }
      currentY += 110;

      // Draw Team Name
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(team.name, x + colWidth / 2, currentY);
      currentY += 30;

      // Draw Roster
      if (team.roster && team.roster.length > 0) {
        ctx.font = "italic bold 16px sans-serif";
        ctx.fillStyle = "#333333";
        ctx.fillText("Roster:", x + colWidth / 2, currentY);
        currentY += 25;

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#555555";
        team.roster.forEach((player) => {
          ctx.fillText(player, x + colWidth / 2, currentY);
          currentY += 25; // Increased space per player
        });
      }
    });

    // Download
    canvas.toBlob((blob) => {
      if (!blob) {
        setIsExporting(false);
        return;
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${tournament.name}-teams.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setIsExporting(false);
    }, "image/png");
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <UserNav
        title={t("tournament.tabs.teams")}
        isBack
        backPath={`/${locale}/user/tournament/${tournamentId}`}
      />
      <main className="container mx-auto flex-1 p-4">
        {loading ? (
          <div className="flex h-full flex-1 items-center justify-center">
            <PulseLoader />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Tabs
                defaultValue="preset"
                value={addMode}
                onValueChange={(value) =>
                  setAddMode(value as "preset" | "custom")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preset">
                    {t("forms.tournament.preset-teams")}
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    {t("forms.tournament.custom-team")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preset" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("forms.tournament.add-preset-team")}
                      </CardTitle>
                      <CardDescription>
                        {t("forms.tournament.search-add-team")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t(
                            "forms.tournament.search-teams-placeholder",
                          )}
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-72">
                        <div className="space-y-2">
                          {filteredPresetTeams.map((team) => (
                            <Button
                              key={team.id}
                              variant="ghost"
                              className="flex w-full items-center justify-start gap-4 p-2 text-left"
                              onClick={() => onAddPresetTeam(team)}
                              disabled={addTeamMutation.isPending}
                            >
                              <Image
                                src={team.logo}
                                alt={team.name}
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain"
                              />
                              <span className="flex-grow">{team.name}</span>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t("forms.tournament.add-custom-team")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...addTeamForm}>
                        <form
                          onSubmit={addTeamForm.handleSubmit(onAddCustomTeam)}
                          className="flex flex-wrap items-end gap-4"
                        >
                          <FormField
                            control={addTeamForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormLabel>
                                  {t("forms.tournament.team-name")}
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={addTeamMutation.isPending}
                          >
                            {t("forms.tournament.add-team")}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {t("tournament.tabs.teams")} ({teams.length})
                </CardTitle>

                {/* Desktop Buttons */}
                <div className="hidden gap-2 md:flex">
                  <Button
                    variant="outline"
                    onClick={exportTeamsToImage}
                    disabled={isExporting || teams.length === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Share className="mr-2 h-4 w-4" />
                    )}
                    {t("forms.tournament.share-list")}
                  </Button>
                  <Dialog
                    open={loadListDialogOpen}
                    onOpenChange={setLoadListDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        {t("forms.tournament.load-list-button")}
                      </Button>
                    </DialogTrigger>
                    {/* ... load dialog content */}
                  </Dialog>

                  {teams.length > 0 && (
                    <Dialog
                      open={saveListDialogOpen}
                      onOpenChange={setSaveListDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {t("forms.tournament.save")}
                        </Button>
                      </DialogTrigger>
                      {/* ... save dialog content */}
                    </Dialog>
                  )}
                </div>

                {/* Mobile Dropdown */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={exportTeamsToImage}
                        disabled={isExporting || teams.length === 0}
                      >
                        <Share className="mr-2 h-4 w-4" />
                        <span>{t("forms.tournament.share-list")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setLoadListDialogOpen(true)}
                      >
                        {t("forms.tournament.load-list")}
                      </DropdownMenuItem>
                      {teams.length > 0 && (
                        <DropdownMenuItem
                          onSelect={() => setSaveListDialogOpen(true)}
                        >
                          {t("forms.tournament.save-list")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                      <Dialog
                        key={team.id}
                        open={editDialogOpen && editingTeam?.id === team.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingTeam(team);
                            setEditDialogOpen(true);
                          } else {
                            setEditDialogOpen(false);
                            setEditingTeam(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start p-0"
                          >
                            <Card className="w-full transition-colors hover:bg-muted">
                              <CardContent className="p-4">
                                <div className="mb-2 flex items-center gap-2">
                                  <Image
                                    src={team.logo ?? "/Play.png"}
                                    alt={team.name}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 object-contain"
                                  />
                                  <CardTitle className="text-lg">
                                    {team.name}
                                  </CardTitle>
                                </div>
                                <CardDescription>
                                  {t("forms.tournament.roster")}
                                </CardDescription>
                                {team.roster && team.roster.length > 0 ? (
                                  <ul className="list-inside list-disc text-sm">
                                    {team.roster.map((player, index) => (
                                      <li key={index}>{player}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {t("no.roster")}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </Button>
                        </DialogTrigger>
                        {editingTeam && (
                          <EditTeamDialog
                            team={editingTeam}
                            onSave={onUpdateTeam}
                            onDelete={onDeleteTeam}
                            isSaving={updateTeamMutation.isPending}
                            isDeleting={deleteTeamMutation.isPending}
                            tournamentId={tournamentId}
                            setOpen={setEditDialogOpen}
                          />
                        )}
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <p>{t("no.teams")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialogs that were inside the buttons */}
            <Dialog
              open={loadListDialogOpen}
              onOpenChange={setLoadListDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("forms.tournament.load-list-title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("forms.tournament.load-list-description")}
                  </DialogDescription>
                </DialogHeader>
                {isLoadingTeamLists ? (
                  <PulseLoader />
                ) : savedTeamLists && savedTeamLists.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {savedTeamLists.map((list: any) => (
                        <div
                          key={list.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="font-medium">{list.name}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleLoadList(list)}
                              disabled={addMultipleTeamsMutation.isPending}
                            >
                              {addMultipleTeamsMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {t("forms.tournament.load-list-button")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteList(list.id)}
                              disabled={deleteTeamListMutation.isPending}
                            >
                              {deleteTeamListMutation.isPending &&
                              deleteTeamListMutation.variables?.listId ===
                                list.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground">
                    {t("no.saved-lists")}
                  </p>
                )}
              </DialogContent>
            </Dialog>

            {teams.length > 0 && (
              <Dialog
                open={saveListDialogOpen}
                onOpenChange={setSaveListDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t("forms.tournament.save-list-title")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("forms.tournament.save-list-description")}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...saveTeamListForm}>
                    <form
                      id="save-list-form"
                      onSubmit={saveTeamListForm.handleSubmit(onSaveTeamList)}
                      className="space-y-4"
                    >
                      <FormField
                        control={saveTeamListForm.control}
                        name="listName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("forms.tournament.list-name")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  "forms.tournament.list-name-placeholder",
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">
                        {t("forms.tournament.cancel")}
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      form="save-list-form"
                      disabled={saveTeamListMutation.isPending}
                    >
                      {saveTeamListMutation.isPending
                        ? t("forms.tournament.saving")
                        : t("forms.tournament.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </main>
      <DonationBanner /><Footer />
    </div>
  );
}

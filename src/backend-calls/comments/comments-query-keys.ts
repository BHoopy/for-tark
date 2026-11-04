
export const commentsQueryKeys = {
  all: ["comments"],
  comments: (tournamentId: string) => [
    ...commentsQueryKeys.all,
    tournamentId,
  ],
};

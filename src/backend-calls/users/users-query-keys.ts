
export const usersQueryKeys = {
  all: ["users"],
  user: (id: string) => [...usersQueryKeys.all, id],
  teamLists: (userId?: string) => [
    ...usersQueryKeys.all,
    userId,
    "teamLists",
  ],
  search: (searchTerm: string) => [...usersQueryKeys.all, "search", searchTerm],
};

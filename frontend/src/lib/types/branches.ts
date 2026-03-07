export type Branch = {
  id: string;
  name: string;
  code: string;
  timeZone: string;
  active: boolean;
};

export type CreateBranchRequest = {
  name: string;
  code: string;
  timeZone: string;
};

export type PatchBranchRequest = {
  name?: string;
  timeZone?: string;
  active?: boolean;
};

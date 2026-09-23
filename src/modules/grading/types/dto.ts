export interface CreateRankDto {
  name: string;
  color?: string;
}

export interface UpdateRankDto {
  name?: string;
  color?: string;
}

export interface AssignRankDto {
  studentId: string;
  rankId: string | null;
}

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { teamService } from '../../services/teamService';
import type { 
  Team, 
  TeamMember, 
  CreateTeamRequest, 
  ApiError 
} from '../../types';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  publicTeams: Team[];
  isLoading: boolean;
  error: string | null;
  teamStats: {
    member_count: number;
    channel_count: number;
    message_count: number;
  } | null;
}

const initialState: TeamState = {
  teams: [],
  currentTeam: null,
  teamMembers: [],
  publicTeams: [],
  isLoading: false,
  error: null,
  teamStats: null,
};

// 异步actions
export const getUserTeams = createAsyncThunk(
  'teams/getUserTeams',
  async (_, { rejectWithValue }) => {
    try {
      const teams = await teamService.getUserTeams();
      return teams;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getPublicTeams = createAsyncThunk(
  'teams/getPublicTeams',
  async (_, { rejectWithValue }) => {
    try {
      const teams = await teamService.getPublicTeams();
      return teams;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getTeamById = createAsyncThunk(
  'teams/getTeamById',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const team = await teamService.getTeamById(teamId);
      return team;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (teamData: CreateTeamRequest, { rejectWithValue }) => {
    try {
      const team = await teamService.createTeam(teamData);
      return team;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ teamId, teamData }: { teamId: number; teamData: Partial<CreateTeamRequest> }, { rejectWithValue }) => {
    try {
      const team = await teamService.updateTeam(teamId, teamData);
      return team;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (teamId: number, { rejectWithValue }) => {
    try {
      await teamService.deleteTeam(teamId);
      return teamId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getTeamMembers = createAsyncThunk(
  'teams/getTeamMembers',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const members = await teamService.getTeamMembers(teamId);
      return members;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const addTeamMember = createAsyncThunk(
  'teams/addTeamMember',
  async ({ teamId, userId, role }: { teamId: number; userId: number; role?: 'admin' | 'member' | 'guest' }, { rejectWithValue }) => {
    try {
      const member = await teamService.addTeamMember(teamId, userId, role);
      return member;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const removeTeamMember = createAsyncThunk(
  'teams/removeTeamMember',
  async ({ teamId, memberId }: { teamId: number; memberId: number }, { rejectWithValue }) => {
    try {
      await teamService.removeTeamMember(teamId, memberId);
      return memberId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getTeamStats = createAsyncThunk(
  'teams/getTeamStats',
  async (teamId: number, { rejectWithValue }) => {
    try {
      const stats = await teamService.getTeamStats(teamId);
      return stats;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const searchTeams = createAsyncThunk(
  'teams/searchTeams',
  async (query: string, { rejectWithValue }) => {
    try {
      const teams = await teamService.searchTeams(query);
      return teams;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

const teamSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
    },
    clearCurrentTeam: (state) => {
      state.currentTeam = null;
      state.teamMembers = [];
      state.teamStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取用户团队
      .addCase(getUserTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = action.payload;
      })
      .addCase(getUserTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取公开团队
      .addCase(getPublicTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPublicTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicTeams = action.payload;
      })
      .addCase(getPublicTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取团队详情
      .addCase(getTeamById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeamById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTeam = action.payload;
      })
      .addCase(getTeamById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 创建团队
      .addCase(createTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams.push(action.payload);
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 更新团队
      .addCase(updateTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teams.findIndex(team => team.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
        if (state.currentTeam?.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 删除团队
      .addCase(deleteTeam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teams = state.teams.filter(team => team.id !== action.payload);
        if (state.currentTeam?.id === action.payload) {
          state.currentTeam = null;
        }
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取团队成员
      .addCase(getTeamMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeamMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teamMembers = action.payload;
      })
      .addCase(getTeamMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 添加团队成员
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.teamMembers.push(action.payload);
      })
      // 移除团队成员
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.teamMembers = state.teamMembers.filter(member => member.id !== action.payload);
      })
      // 获取团队统计
      .addCase(getTeamStats.fulfilled, (state, action) => {
        state.teamStats = action.payload;
      })
      // 搜索团队
      .addCase(searchTeams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchTeams.fulfilled, (state, action) => {
        state.isLoading = false;
        state.publicTeams = action.payload;
      })
      .addCase(searchTeams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentTeam, clearCurrentTeam } = teamSlice.actions;
export default teamSlice.reducer; 
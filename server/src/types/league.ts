export interface LeagueCredentialsDto {
  port: number;
  username: string;
  password: string;
  address: string;
  authorizationHeader: string;
}

export interface LeagueApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface CurrentSummonerDto {
  displayName: string;
  gameName?: string;
  tagLine?: string;
  profileIconId?: number;
  summonerId?: number;
  puuid?: string;
  summonerLevel?: number;
  raw: unknown;
}

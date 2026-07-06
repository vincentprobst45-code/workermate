export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
  };
  tenant!: {
    id: string;
    name: string;
  };
}

import { AuthService } from './auth.service';
import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { AxiosResponse } from 'axios';
@Controller('/spotify-login')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('authorization')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    const generateRandomString = function (length) {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const client_id = this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');
    const redirect_uri = this.authService.configService.get<string>('SPOTIFY_REDIRECT_URI');

    const response_type = 'code';
    const spotify_state = generateRandomString(30);
    const show_dialog = true;
    const scope = 'user-read-private user-read-email';

    res.cookie('spotify_authentication_state', spotify_state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });

    res.send({
      data: `https://accounts.spotify.com/fr/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${spotify_state}&show_dialog=${show_dialog}`,
    });
  }

  @Get('callback')
  async spotifyCallBack(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query,
  ): Promise<{
    user: AxiosResponse<any, any>;
    spotifyAccessToken: any;
  }> {
    const spotifyCode = query.code || null;
    const spotifyAuthenticationStateFromQuery = query.state || null;
    const spotifyAuthenticationStateFromCookie = req.cookies.spotify_authentication_state || null;

    const client_id = this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');
    const client_secret = this.authService.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    const redirect_uri = this.authService.configService.get<string>('SPOTIFY_REDIRECT_URI');

    if (
      spotifyAuthenticationStateFromQuery === null ||
      spotifyAuthenticationStateFromQuery !== spotifyAuthenticationStateFromCookie
    ) {
      res.redirect('http://localhost:3000/traitement-connexion');
    } else {
      // spotifyAuthenticationState from cookie and query are similare, meaning is the right user who's making the request, not a third-party one

      // Delete spotify authentication state cookie, don't need anymore, at this step the security verificaiton is already done
      res.clearCookie('spotify_authentication_state');

      // Authorization value credentials base64 encoded
      const authorizationCredentialsEncoded = Buffer.from(`${client_id}:${client_secret}`).toString(
        'base64',
      );

      const spotifyData = await this.authService.httpService.axiosRef.request({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authorizationCredentialsEncoded}`,
        },
        data: {
          grant_type: 'authorization_code',
          code: spotifyCode,
          redirect_uri,
        },
      });

      // Retrieve user profil informations
      const userDataProfile = await this.authService.httpService.axiosRef.request({
        url: 'https://api.spotify.com/v1/me',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${spotifyData.data.access_token}`,
        },
      });

      res
        .cookie('refresh_token', spotifyData.data.refresh_token, {
          //No expires or max-age attributes specified, it will be a session cookie, each time user close his window tab, he'll be disabled
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
        })
        .cookie('loggedIn', 'true', {
          maxAge: 120000,
        })
        .redirect('http://localhost:3000/traitement-connexion');

      return {
        user: userDataProfile,
        spotifyAccessToken: spotifyData.data.access_token,
      };
    }
  }

  @Get('refresh-token')
  async refreshToken(@Req() req) {
    const client_id = this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');

    const client_secret = this.authService.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    const authorizationCredentialsEncoded = Buffer.from(`${client_id}:${client_secret}`).toString(
      'base64',
    );

    try {
      const refreshTokenRequest = await this.authService.httpService.axiosRef.request({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authorizationCredentialsEncoded}`,
        },
        data: {
          grant_type: 'refresh_token',
          refresh_token: req.cookies.refresh_token,
        },
      });
      return refreshTokenRequest.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

import { AuthService } from './auth.service';
import { Controller, Get, Req, Res, Query, Headers } from '@nestjs/common';
import { Request, Response } from 'express';

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
      const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const client_id =
      this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');
    const redirect_uri = this.authService.configService.get<string>(
      'SPOTIFY_REDIRECT_URI',
    );
    const response_type = 'code';
    const spotify_state = generateRandomString(30);
    const show_dialog = true;
    const scope = 'user-read-private user-read-email';

    res
      .cookie('spotify_authentication_state', spotify_state)
      .redirect(
        `https://accounts.spotify.com/fr/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${spotify_state}&show_dialog=${show_dialog}`,
      );

    // const spotifyUrl = `https://accounts.spotify.com/fr/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${spotify_state}&show_dialog=${show_dialog}`;
    // const spotifyResponse = await firstValueFrom(
    //   this.authService.httpService.get(spotifyUrl, {
    //     headers: { 'Access-Control-Allow-Origin': '*' },
    //   }),
    // );
    // console.log('spotifyResponse :>> ', spotifyResponse.data);
  }

  @Get('callback')
  async spotifyCallBack(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code || null;
    // const state = req.query.state || null;
    const client_id =
      this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');
    const client_secret = this.authService.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    );
    const redirect_uri = this.authService.configService.get<string>(
      'SPOTIFY_REDIRECT_URI',
    );

    // const storedState = req.cookies
    //   ? req.cookies['spotify_authentication_state']
    //   : null;

    // if (state === null || state !== storedState) {
    if (code === null) {
      res.redirect('/authentification-echec');
    } else {
      // state and storedState are similare so it's the same client as the previous one who's asking for the access token
      // Delete spotify authentication state string, don't need anymore we already made the verificaiton

      // Authorization value credentials base64 encoded
      const authorizationCredentialsEncoded = Buffer.from(
        `${client_id}:${client_secret}`,
      ).toString('base64');

      const spotifyData = await this.authService.httpService.axiosRef.request({
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authorizationCredentialsEncoded}`,
        },
        data: {
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        },
      });

      res
        .cookie('refresh_token', spotifyData.data.refresh_token, {
          //No expires or max-age attributes specified, it will be a session cookie, each time user close his window tab he'll be deleted
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
        })
        .redirect('http://localhost:3000/home');

      return spotifyData.data.access_token;
    }
  }

  @Get('refresh-token')
  async refreshToken(@Query() query, @Headers() headers) {
    console.log('headers :>> ', headers);
    console.log('query :>> ', query);

    const client_id =
      this.authService.configService.get<string>('SPOTIFY_CLIENT_ID');

    const client_secret = this.authService.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
    );

    const authorizationCredentialsEncoded = Buffer.from(
      `${client_id}:${client_secret}`,
    ).toString('base64');
    try {
      const refreshTokenRequest =
        await this.authService.httpService.axiosRef.request({
          url: 'https://accounts.spotify.com/api/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${authorizationCredentialsEncoded}`,
          },
          data: {
            grant_type: 'refresh_token',
            refresh_token: 'A DEFINIR',
          },
        });
    } catch (error) {
      console.log('error Refresh Token :>> ', error);
    }
  }
}

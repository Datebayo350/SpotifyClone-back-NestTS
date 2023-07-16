# :memo: History of authentication module building :memo:

## [0Atuh 2.0](https://auth0.com/fr/intro-to-iam/what-is-oauth-2) - [Spotify Autorization Code Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)

#### The actual user authentication run's on this method, several implementation way's have been tried :

1. **The authorization request handled by the frontend**, too dificult to store authentication code and tokens properly during the requests and thereafter base the authentication persistence on these options :  <br><br>

    * Not able **to store tokens in memory ( Redux )**, they ' ll go from the sotre once the user is redirected to the application ( to each page / application refresh ), similar obstacles encountered when tried to store them in window  <br><br>
    
    * Can't store **serving as credentials tokens in localStorage** and base the authentication on them, it's not a good practice, we expose the user to possible **[XSS attacks](https://indepth.dev/posts/1382/localstorage-vs-cookies)** <br><br>

    * Can't set securised **securised httpOnly cookies** with an session lifetime in front-end <br><br>


2. **The authorization request entirely handled by the backend server**, authorization flow hit firstly the **backend /login endpoint** once the use click on the login button, when the request is inside the server redirect him to spotify authorization scope page in the client, then the authorization code will be send to the **backend /callback endpoint**, from there the goal is to send back credentials to frontend <br> <br>

    Here **the main problem** is the **spotify CORS Allow Origin policy**, haven't found the way to around them, neither with a simple proxy function in the backend, so the spotify authorization scope page is never reached by the user <br><br>

3. **The authorization request handled by the both sides**, in this case the user is redirected to spotify authorization scope page once he click on the login button : <br> <br> 
    
    * Once the scope gived, the authorization code will be sent to the **backend /callback endpoint** present in the url params <br> <br>

    * The **controller will get the access and refresh tokens** with the authorization code <br> <br>
    
    * Then he will **set the refresh inside an httpOnly cookie** associated with the response and **return the access one in the reponse body** <br> <br>
    
    This method works fine but haven't found the way to intercept the access token on the frontend as none API call from the code have been made, the authentication must be based on the access token presence in the Redux store.

---
#### TODO: Next steps to get an fully working authentication process

>##### In the /callback endpoint
    > 1. Set to the response an additional none-httpOnly cookie to the refresh one, with value : 
    > **``` { loggedIn: true, expires : timestamp 2min} ```** <br> <br>
    > 2. Redirect the user to the **frontend callback endpoint '/traitement-connexion'** <br> <br>
    > 3. In this component an useEffect hooks will track the document.cookie value
    >*  **If the cookie is present** : <br> <br>
    >    * **And no access_token** is present in the **Redux store**, send an request to the backend **'/refresh-token'** endpoint <br> <br>
    >       * Store the newly refresh access token in the **Redux store** <br><br>
    >       * As this **LoginProccessing** component  and the **Login** one are available only inside the **UnAuthenticatedRoutes** component, the user will automatically be redirected to the **AuthenticatedRoutes** <br> <br>
    >*  **If the cookie aren't present** : <br> <br>
    >    * The user will be redirected to the **login page**          


>##### In the /refresh-token endpoint
    >1. After the refresh, retrieve user spotify profile data with his access token <br><br> 
    >2. Identify if his already present in our user local database <br>
    > * **If he's already existing** : <br>
    >   * We update his tokens <br> <br>
    >* **If he's not existing** : 
    >    * We create him (tokens include) <br><br>

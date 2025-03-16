export const cognitoAuthConfig = {
    authority: "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_cMjDRFoFC",
    client_id: "1a876t4gftennmng7milfuqucc",
    redirect_uri: "http://localhost:5173",
    response_type: "code",
    scope: "email openid phone",
};

export const signOutRedirect = () => {
    const clientId = "1a876t4gftennmng7milfuqucc";
    const logoutUri = "http://localhost:5173";
    const cognitoDomain = "https://ap-southeast-2cmjdrfofc.auth.ap-southeast-2.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
    console.log('Invalid or missing push token:', expoPushToken);
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    channelId: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function sendMultiplePushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken['));
  if (validTokens.length === 0) return;

  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    channelId: 'default',
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending multiple push notifications:', error);
  }
}

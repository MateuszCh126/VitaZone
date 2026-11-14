export const readCheckoutReturn = (searchParams) => {
    const terrariumSessionId = searchParams.get('terrarium_session_id');
    return {
        sessionId: terrariumSessionId || searchParams.get('session_id'),
        isTerrarium: Boolean(terrariumSessionId),
        wasCancelled: searchParams.get('checkout') === 'cancelled'
    };
};

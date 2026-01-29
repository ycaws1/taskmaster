export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { checkAndSendNotifications } = await import('@/lib/notificationService');

        console.log('Instrumentation: Registering notification check interval (every 30s)...');

        // Run immediately on start
        checkAndSendNotifications().catch(e => console.error('Initial notification check failed:', e));

        // Set interval
        setInterval(async () => {
            try {
                await checkAndSendNotifications();
            } catch (error) {
                console.error('Scheduled notification check failed:', error);
            }
        }, 30000); // Check every 30 seconds
    }
}

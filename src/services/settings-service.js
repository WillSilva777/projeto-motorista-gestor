(function () {
    const DEFAULT_SETTINGS = Object.freeze({
        monthly_goal_gross: 6000,
        monthly_goal_net: 4500,
        weekly_goal_gross: 1500,
        weekly_goal_net: 1000,
        fuel_price: 5.79,
        car_consumption: 11
    });

    function toNumber(value, fallbackValue) {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
    }

    function sanitize(rawSettings) {
        const settings = Object.assign({}, DEFAULT_SETTINGS, rawSettings || {});

        return {
            monthly_goal_gross: Math.max(0, toNumber(settings.monthly_goal_gross, DEFAULT_SETTINGS.monthly_goal_gross)),
            monthly_goal_net: Math.max(0, toNumber(settings.monthly_goal_net, DEFAULT_SETTINGS.monthly_goal_net)),
            weekly_goal_gross: Math.max(0, toNumber(settings.weekly_goal_gross, DEFAULT_SETTINGS.weekly_goal_gross)),
            weekly_goal_net: Math.max(0, toNumber(settings.weekly_goal_net, DEFAULT_SETTINGS.weekly_goal_net)),
            fuel_price: Math.max(0, toNumber(settings.fuel_price, DEFAULT_SETTINGS.fuel_price)),
            car_consumption: Math.max(0.1, toNumber(settings.car_consumption, DEFAULT_SETTINGS.car_consumption))
        };
    }

    async function load() {
        const savedSettings = await window.storageService.getOne('settings', 'appSettings');
        return sanitize(savedSettings || DEFAULT_SETTINGS);
    }

    async function save(rawSettings) {
        const sanitizedSettings = sanitize(rawSettings);
        await window.storageService.put('settings', Object.assign({ id: 'appSettings' }, sanitizedSettings));
        return sanitizedSettings;
    }

    function getFuelCostPerKm(settings) {
        const sanitizedSettings = sanitize(settings);
        return sanitizedSettings.car_consumption > 0
            ? sanitizedSettings.fuel_price / sanitizedSettings.car_consumption
            : 0;
    }

    window.settingsService = {
        DEFAULT_SETTINGS,
        sanitize,
        load,
        save,
        getFuelCostPerKm
    };
})();

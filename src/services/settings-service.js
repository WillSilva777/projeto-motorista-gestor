(function () {
    const DEFAULT_SETTINGS = Object.freeze({
        monthly_goal_gross: 6000,
        monthly_goal_net: 4500,
        weekly_goal_gross: 1500,
        weekly_goal_net: 1000,
        fuel_price: 5.79,
        car_consumption: 11,
        vehicle_operation_type: 'rented',
        insurance_monthly: 0,
        vehicle_installment_monthly: 0,
        vehicle_rental_weekly: 0,
        other_fixed_costs_monthly: 0
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
            car_consumption: Math.max(0.1, toNumber(settings.car_consumption, DEFAULT_SETTINGS.car_consumption)),
            vehicle_operation_type: String(settings.vehicle_operation_type || DEFAULT_SETTINGS.vehicle_operation_type),
            insurance_monthly: Math.max(0, toNumber(settings.insurance_monthly, DEFAULT_SETTINGS.insurance_monthly)),
            vehicle_installment_monthly: Math.max(0, toNumber(settings.vehicle_installment_monthly, DEFAULT_SETTINGS.vehicle_installment_monthly)),
            vehicle_rental_weekly: Math.max(0, toNumber(settings.vehicle_rental_weekly, DEFAULT_SETTINGS.vehicle_rental_weekly)),
            other_fixed_costs_monthly: Math.max(0, toNumber(settings.other_fixed_costs_monthly, DEFAULT_SETTINGS.other_fixed_costs_monthly))
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

    function getFixedCostsDaily(settings) {
        const sanitizedSettings = sanitize(settings);
        const monthlyTotal = getFixedCostsMonthly(sanitizedSettings);
        return monthlyTotal / 30;
    }

    function getFixedCostsWeekly(settings) {
        const sanitizedSettings = sanitize(settings);
        const monthlyTotal = getFixedCostsMonthly(sanitizedSettings);
        return (monthlyTotal / 30) * 7;
    }

    function getFixedCostsMonthly(settings) {
        const sanitizedSettings = sanitize(settings);
        let monthlyTotal = sanitizedSettings.insurance_monthly + 
                          sanitizedSettings.vehicle_installment_monthly + 
                          sanitizedSettings.other_fixed_costs_monthly;

        if (sanitizedSettings.vehicle_operation_type === 'rented') {
            monthlyTotal += sanitizedSettings.vehicle_rental_weekly * 4.29;
        }

        return monthlyTotal;
    }

    window.settingsService = {
        DEFAULT_SETTINGS,
        sanitize,
        load,
        save,
        getFuelCostPerKm,
        getFixedCostsDaily,
        getFixedCostsWeekly,
        getFixedCostsMonthly
    };
})();

(function () {
    const BAR_COLORS = [
        '#22c55e',
        '#22c55e',
        '#22c55e',
        '#22c55e',
        '#22c55e',
        '#f59e0b',
        '#ef4444'
    ];

    function drawRoundedRect(context, x, y, width, height, radius) {
        const safeRadius = Math.min(radius, width / 2, height / 2);

        context.beginPath();
        context.moveTo(x + safeRadius, y);
        context.lineTo(x + width - safeRadius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        context.lineTo(x + width, y + height);
        context.lineTo(x, y + height);
        context.lineTo(x, y + safeRadius);
        context.quadraticCurveTo(x, y, x + safeRadius, y);
        context.closePath();
    }

    function drawWeeklyEarningsChart(canvas, chartData) {
        if (!canvas) {
            return;
        }

        const labels = chartData.labels || [];
        const values = chartData.values || [];
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(canvas.clientWidth || 0, 320);
        const height = 280;
        const context = canvas.getContext('2d');

        canvas.width = Math.floor(width * devicePixelRatio);
        canvas.height = Math.floor(height * devicePixelRatio);
        canvas.style.height = `${height}px`;

        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);

        const padding = { top: 24, right: 12, bottom: 52, left: 54 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const maxValue = Math.max(...values, 1);
        const stepCount = 4;
        const slotWidth = chartWidth / Math.max(values.length, 1);
        const barWidth = Math.min(36, slotWidth * 0.6);

        context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        context.lineWidth = 1;
        context.fillStyle = '#9ca3af';
        context.font = '12px Segoe UI, sans-serif';

        for (let step = 0; step <= stepCount; step += 1) {
            const ratio = step / stepCount;
            const y = padding.top + chartHeight - (chartHeight * ratio);
            const value = maxValue * ratio;

            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);
            context.stroke();
            context.fillText(`R$ ${value.toFixed(0)}`, 8, y + 4);
        }

        labels.forEach((label, index) => {
            const value = values[index] || 0;
            const ratio = value / maxValue;
            const barHeight = chartHeight * ratio;
            const x = padding.left + (slotWidth * index) + ((slotWidth - barWidth) / 2);
            const y = padding.top + chartHeight - barHeight;

            context.fillStyle = BAR_COLORS[index] || '#22c55e';
            drawRoundedRect(context, x, y, barWidth, Math.max(barHeight, 2), 8);
            context.fill();

            context.fillStyle = '#d1d5db';
            context.textAlign = 'center';
            context.fillText(label, x + (barWidth / 2), height - 18);
            context.fillText(`R$ ${value.toFixed(0)}`, x + (barWidth / 2), Math.max(y - 8, 16));
        });

        if (values.every((value) => value === 0)) {
            context.fillStyle = '#9ca3af';
            context.textAlign = 'center';
            context.font = '14px Segoe UI, sans-serif';
            context.fillText('Sem dados para o grafico ainda', width / 2, (height / 2) + 12);
        }
    }

    window.chartService = {
        drawWeeklyEarningsChart
    };
})();

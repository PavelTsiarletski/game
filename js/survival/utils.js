window.SURVIVAL = window.SURVIVAL || {};

window.SURVIVAL.Utils = {
    // Math Helpers
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Collision Detection (Circle vs Circle)
    checkCircleCollision(c1, c2) {
        const dist = this.getDistance(c1.x, c1.y, c2.x, c2.y);
        return dist < (c1.radius + c2.radius);
    },

    // Collision Detection (Circle vs Rectangle/Canvas bounds)
    checkBounds(circle, width, height) {
        if (circle.x - circle.radius < 0) circle.x = circle.radius;
        if (circle.x + circle.radius > width) circle.x = width - circle.radius;
        if (circle.y - circle.radius < 0) circle.y = circle.radius;
        if (circle.y + circle.radius > height) circle.y = height - circle.radius;
    },

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
};

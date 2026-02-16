window.Game = window.Game || {};

window.Game.PlanetRenderer = (function(){
    let canvas, ctx, width, height;
    let particles = [];

    function init(cvs){
        canvas = cvs;
        ctx = canvas.getContext("2d");
        width = canvas.width;
        height = canvas.height;
        
        // Init dust particles
        for(let i=0; i<60; i++){
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2, // Slow movement
                vy: (Math.random() - 0.5) * 0.2,
                s: Math.random() * 2 + 1
            });
        }
    }

    function draw(state, stage){
        if(!ctx) return;
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        
        // Background particles (Always visible but more subtle if planet exists)
        ctx.fillStyle = "#ffffff";
        for(let p of particles){
            ctx.globalAlpha = (stage.id === 'nebula') ? (0.3 + Math.random()*0.2) : 0.1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
            ctx.fill();
            
            // Move
            p.x += p.vx;
            p.y += p.vy;
            // Wrap
            if(p.x < 0) p.x = width;
            if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height;
            if(p.y > height) p.y = 0;
        }

        // Draw Planet Logic
        const planetColor = stage.color;
        
        if(stage.id === 'nebula'){
             // Draw swirling core based on matter
             const coreSize = Math.min(50, state.totalMatter / 10 + 5);
             
             const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 2);
             grad.addColorStop(0, planetColor);
             grad.addColorStop(1, "transparent");
             
             ctx.globalAlpha = 0.6;
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.arc(cx, cy, coreSize * 2, 0, Math.PI*2);
             ctx.fill();
             
             if(state.totalMatter > 100){
                 ctx.globalAlpha = 1;
                 ctx.fillStyle = "#fff";
                 ctx.beginPath();
                 ctx.arc(cx, cy, coreSize * 0.2, 0, Math.PI*2);
                 ctx.fill();
             }

        } else {
            // Planet Formed
            let radius = 80;
            // Grow slightly with upgrades?
            
            // Halo/Atmosphere
            const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
            glow.addColorStop(0, planetColor);
            glow.addColorStop(1, "transparent");
            
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.5, 0, Math.PI*2);
            ctx.fill();
            
            // Planet Body
            ctx.globalAlpha = 1;
            ctx.fillStyle = planetColor;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI*2);
            ctx.fill();
            
            // Simple Shadow
            const shadow = ctx.createRadialGradient(cx - 30, cy - 30, radius * 0.2, cx, cy, radius);
            shadow.addColorStop(0, "rgba(255,255,255,0.1)");
            shadow.addColorStop(0.5, "transparent");
            shadow.addColorStop(1, "rgba(0,0,0,0.8)");
            
            ctx.fillStyle = shadow;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI*2);
            ctx.fill();
        }
    }

    return { init, draw };
})();

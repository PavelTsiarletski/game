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
        const time = Date.now() * 0.001;
        
        // Background particles
        ctx.fillStyle = "#ffffff";
        for(let p of particles){
            // Nebula/Space effect
            ctx.globalAlpha = (stage.id === 'nebula') ? (0.3 + Math.sin(time + p.x)*0.2) : 0.1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
            ctx.fill();
            
            p.x += p.vx;
            p.y += p.vy;
            if(p.x < 0) p.x = width;
            if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height;
            if(p.y > height) p.y = 0;
        }

        // --- STAGE RENDERING ---
        
        if(stage.id === 'nebula'){
             // Swirling Nebula Cloud
             const coreSize = Math.min(60, state.totalMatter / 10 + 10);
             const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 3);
             grad.addColorStop(0, stage.color);
             grad.addColorStop(0.4, "rgba(108, 92, 231, 0.2)");
             grad.addColorStop(1, "transparent");
             
             ctx.globalAlpha = 0.8;
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.arc(cx, cy, coreSize * 3, 0, Math.PI*2);
             ctx.fill();
             
             // Core glow
             ctx.fillStyle = "#fff";
             ctx.globalAlpha = 0.5 + Math.sin(time*3)*0.2;
             ctx.beginPath();
             ctx.arc(cx, cy, coreSize * 0.2, 0, Math.PI*2);
             ctx.fill();

        } else if (stage.id === 'planetesimal') {
            // Clumpy Rock Field
            const radius = 60;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.2);
            
            ctx.fillStyle = stage.color;
            for(let i=0; i<8; i++){
                const ang = (i / 8) * Math.PI * 2;
                const dist = 30 + Math.sin(time + i)*10;
                const s = 15 + Math.cos(time*2 + i)*5;
                ctx.beginPath();
                ctx.arc(Math.cos(ang)*dist, Math.sin(ang)*dist, s, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
            
        } else {
            // SPHERICAL PLANET STAGES
            let radius = 100;
            
            // 1. Atmosphere Halo (common)
            const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
            glow.addColorStop(0, stage.color);
            glow.addColorStop(1, "transparent");
            
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.5, 0, Math.PI*2);
            ctx.fill();
            
            // 2. Base Planet Body
            ctx.globalAlpha = 1;
            ctx.fillStyle = stage.color;
            
            // Texture/Pattern based on stage
            if(stage.id === 'proto' || stage.id === 'differentiation' || stage.id === 'volcanism'){
                // Magma/Lava
                ctx.fillStyle = "#2d3436"; // Dark rock base
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
                
                // Lava Cracks
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.clip();
                
                ctx.strokeStyle = "#e17055";
                ctx.lineWidth = 4;
                for(let i=0; i<10; i++){
                    ctx.beginPath();
                    ctx.moveTo(cx - radius + Math.random()*radius*2, cy - radius + Math.random()*radius*2);
                    ctx.lineTo(cx - radius + Math.random()*radius*2, cy - radius + Math.random()*radius*2);
                    ctx.stroke();
                }
                ctx.restore();
                
            } else if (stage.id === 'ocean' || stage.id === 'life' || stage.id === 'atmosphere' || stage.id === 'lush' || stage.id === 'civilization') {
                // Ocean base
                ctx.fillStyle = "#0984e3";
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
                
                // Continents
                let landColor = '#b2bec3';
                if(stage.id === 'life') landColor = '#2ecc71';
                if(stage.id === 'lush') landColor = '#10ac84'; // Darker Lush Green
                if(stage.id === 'civilization') landColor = '#636e72'; // Greyish for cities? or Green+Grey
                
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.clip();
                
                ctx.fillStyle = landColor;
                // Simple blobs for continents
                ctx.beginPath();
                ctx.arc(cx - 30, cy - 20, 40, 0, Math.PI*2);
                ctx.arc(cx + 40, cy + 30, 35, 0, Math.PI*2);
                // Extra land for lush/civ
                if(stage.id === 'lush' || stage.id === 'civilization'){
                    ctx.arc(cx - 10, cy + 50, 25, 0, Math.PI*2);
                }
                ctx.fill();
                
                // Clouds
                if(stage.id !== 'ocean'){ // Atmosphere+
                    ctx.fillStyle = "rgba(255,255,255,0.4)";
                    ctx.translate(Math.sin(time*0.1)*20, 0); 
                    ctx.beginPath();
                    ctx.arc(cx - 50, cy - 40, 25, 0, Math.PI*2);
                    ctx.arc(cx + 10, cy + 10, 30, 0, Math.PI*2);
                    ctx.arc(cx + 40, cy - 30, 20, 0, Math.PI*2);
                    ctx.fill();
                    ctx.translate(-Math.sin(time*0.1)*20, 0); // Reset for lights
                }
                
                ctx.restore();

            } else if (stage.id === 'technosphere') {
                // Tech World
                ctx.fillStyle = "#2d3436"; // Dark Base
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
                
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.clip();
                
                // Converting planet into machine
                ctx.strokeStyle = "#00cec9"; // Cyan lines
                ctx.lineWidth = 2;
                
                // Grid or circuitry
                ctx.beginPath();
                for(let i=0; i<10; i++){
                    // Latitudes
                    ctx.moveTo(cx - radius, cy - radius + i*20);
                    ctx.lineTo(cx + radius, cy - radius + i*20);
                    // Longitudes (curved)
                    // Simplified: just lines
                    ctx.moveTo(cx - radius + i*20, cy - radius);
                    ctx.lineTo(cx - radius + i*20, cy + radius);
                }
                ctx.stroke();
                
                // Glowing nodes
                ctx.fillStyle = "#81ecec";
                for(let i=0; i<5; i++){
                     const px = cx + Math.sin(time + i)*40;
                     const py = cy + Math.cos(time*1.5 + i)*40;
                     ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
                }

                ctx.restore();

            } else {
                 // Default Solid (Crust)
                 ctx.fillStyle = stage.color;
                 ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
            }

            // 3. Shadow (Lighting)
            const shadow = ctx.createRadialGradient(cx - 40, cy - 40, radius * 0.5, cx, cy, radius);
            shadow.addColorStop(0, "rgba(255,255,255,0.1)");
            shadow.addColorStop(0.5, "transparent");
            shadow.addColorStop(1, "rgba(0,0,0,0.85)");
            
            ctx.fillStyle = shadow;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI*2);
            ctx.fill();
            
            // 4. City Lights (Civ Stage Only) - Drawn ON TOP of Shadow
            if(stage.id === 'civilization'){
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.clip();
                
                ctx.fillStyle = "#fffa65"; // Yellow/Warm light
                // Draw lights only on the "dark" side (Bottom-Right based on shadow)
                // Random clusters
                for(let i=0; i<20; i++){
                    // Bias positions towards bottom-right
                    const offX = (Math.random() * 80); 
                    const offY = (Math.random() * 80);
                    
                    const lx = cx + offX - 20; 
                    const ly = cy + offY - 20;
                    
                    // Simple distance check from center to ensure inside planet
                    const d = Math.sqrt((lx-cx)*(lx-cx) + (ly-cy)*(ly-cy));
                    if(d < radius - 5){
                        ctx.globalAlpha = 0.6 + Math.random()*0.4; // Twinkle
                        ctx.beginPath(); ctx.arc(lx, ly, 1.5, 0, Math.PI*2); ctx.fill();
                    }
                }
                ctx.restore();
            }
        }
    }

    return { init, draw };
})();

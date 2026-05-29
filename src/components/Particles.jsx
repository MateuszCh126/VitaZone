import React, { useEffect, useRef } from 'react';

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(ctx, canvas) {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }

        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw(ctx);
    }
}

const createParticles = (canvas) => {
    if (window.innerWidth < 768) {
        return [];
    }

    const particles = [];
    const particleCount = (canvas.height * canvas.width) / 25000;

    for (let i = 0; i < particleCount; i += 1) {
        const size = (Math.random() * 2) + 0.5;
        const x = (Math.random() * ((window.innerWidth - size * 2) - (size * 2)) + size * 2);
        const y = (Math.random() * ((window.innerHeight - size * 2) - (size * 2)) + size * 2);
        const directionX = (Math.random() * 1) - 0.5;
        const directionY = (Math.random() * 1) - 0.5;

        particles.push(new Particle(x, y, directionX, directionY, size, 'rgba(0, 255, 136, 0.5)'));
    }

    return particles;
};

const Particles = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx) {
            return undefined;
        }

        let animationFrameId;
        let resizeTimeout;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = createParticles(canvas);
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const particle of particles) {
                particle.update(ctx, canvas);
            }
        };

        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 200);
        };

        resizeCanvas();
        animate();
        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            cancelAnimationFrame(animationFrameId);
            clearTimeout(resizeTimeout);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20"
        />
    );
};

export default Particles;

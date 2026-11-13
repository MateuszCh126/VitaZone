import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const MouseGlow = () => {
    const mouseX = useMotionValue(typeof window === 'undefined' ? 0 : window.innerWidth / 2);
    const mouseY = useMotionValue(typeof window === 'undefined' ? 0 : window.innerHeight / 2);
    const springConfig = { damping: 30, stiffness: 80, mass: 0.8 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (!window.matchMedia('(min-width: 768px) and (pointer: fine)').matches) return undefined;
        const handlePointerMove = (event) => {
            mouseX.set(event.clientX);
            mouseY.set(event.clientY);
        };
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        return () => window.removeEventListener('pointermove', handlePointerMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            aria-hidden="true"
            style={{ x, y, translateX: '-50%', translateY: '-50%' }}
            className="pointer-events-none fixed left-0 top-0 z-0 hidden h-36 w-36 rounded-full bg-primary/5 blur-[48px] md:block"
        />
    );
};

export default MouseGlow;

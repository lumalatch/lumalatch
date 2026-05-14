export interface SceneState {
    t: number;
    material: {
        opacity: number;
        blur: number;
        bgShift: number;
    };
    physics: {
        scale: number;
        yOffset: number;
    };
    narrative: {
        opacity: number;
        yShift: number;
    };
    transition: {
        zIndex: number;
        fade: number;
    };
}

export const SceneMachine = {
    compute: (t: number): SceneState => {
        // High tension curve between 0.5 and 0.85 (Act III to Act IV transition)
        let tensionFactor = 0;
        if (t > 0.5 && t < 0.85) {
            const p = (t - 0.5) / 0.35;
            // cubic-bezier approximation for snap tension
            tensionFactor = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        } else if (t >= 0.85) {
            tensionFactor = 1;
        }

        return {
            t,
            material: {
                opacity: t < 0.1 ? t * 10 : 1,
                blur: (1 - t) * 10 + (tensionFactor * 5),
                bgShift: t * 50
            },
            physics: {
                // Tension factor adds a physical "snap" scale and yOffset
                scale: 1 + t * 0.5 + (tensionFactor * 0.15),
                yOffset: t * -100 - (tensionFactor * 50)
            },
            narrative: {
                opacity: t > 0.2 ? 1 : 0,
                yShift: (1 - t) * 20
            },
            transition: {
                zIndex: t > 0.75 ? 10 : 1,
                fade: t
            }
        };
    }
};
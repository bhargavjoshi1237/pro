"use client";

import { Canvas, extend } from "@react-three/fiber";
import { Effects } from "@react-three/drei";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { Particles } from "./Particles";
import { VignetteShader } from "./shaders/vignetteShader";
import { useTheme } from "@/context/ThemeContext";

extend({ ShaderPass });

export function WaveBackground() {
    const { theme } = useTheme();

    // Determine particle color based on theme
    // Default to white (dark mode) if theme is undefined
    const particleColor = theme === 'light' ? '#000000' : '#ffffff';

    const config = {
        speed: 1.0,
        noiseScale: 0.6,
        noiseIntensity: 0.52,
        timeScale: 1,
        focus: 3.8,
        aperture: 1.79,
        pointSize: 10.0, // Increased point size
        opacity: 0.5,   // Decreased opacity
        planeScale: 10.0,
        size: 512,
        vignetteDarkness: 1.5,
        vignetteOffset: 0.4,
    };

    return (
        <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-[#191919] pointer-events-none transition-colors duration-300">
            <Canvas
                camera={{
                    position: [
                        1.2629783123314589, 2.664606471394044, -1.8178993743288914,
                    ],
                    fov: 50,
                    near: 0.01,
                    far: 300,
                }}
                gl={{ antialias: false, alpha: true }}
                dpr={[1, 2]}
            >
                <Particles
                    speed={config.speed}
                    aperture={config.aperture}
                    focus={config.focus}
                    size={config.size}
                    noiseScale={config.noiseScale}
                    noiseIntensity={config.noiseIntensity}
                    timeScale={config.timeScale}
                    pointSize={config.pointSize}
                    opacity={config.opacity}
                    planeScale={config.planeScale}
                    color={particleColor}
                />
                <Effects multisamping={0} disableGamma>
                    <shaderPass
                        args={[VignetteShader]}
                        uniforms-darkness-value={config.vignetteDarkness}
                        uniforms-offset-value={config.vignetteOffset}
                    />
                </Effects>
            </Canvas>
        </div>
    );
}

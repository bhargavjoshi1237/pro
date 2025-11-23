"use client"

import { motion } from "framer-motion"
import { Pacifico } from "next/font/google"
import { cn } from "@/lib/utils"

const pacifico = Pacifico({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-pacifico",
})

export default function HeroGeometric({
    badge = "Prodigy UI",
    title1 = "Elevate Your",
    title2 = "Creative Vision",
}) {
    return (
        <div className="relative min-h-[85vh] w-full flex items-center justify-center overflow-hidden bg-transparent pt-16 md:pt-20">
            <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12 backdrop-blur-sm"
                    >
                        <span className="text-sm text-gray-600 dark:text-white/80 tracking-wide">{badge}</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 tracking-tight px-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/80">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-white/90 to-rose-400",
                                    pacifico.className,
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                    >
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-white/60 mb-10 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
                            Crafting exceptional digital experiences through innovative design and cutting-edge technology.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
                    >
                        <a href="/login" className="px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl">
                            Get Started
                        </a>
                        <a href="/login" className="px-8 py-3 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-gray-200/20 dark:border-white/10 text-gray-900 dark:text-white font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200">
                            Learn More
                        </a>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

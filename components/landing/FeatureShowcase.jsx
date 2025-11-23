'use client';

import {
    SparklesIcon,
    BoltIcon,
    FolderIcon,
    DocumentTextIcon,
    UsersIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';

export function FeatureShowcase() {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="mb-20 text-center max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white font-serif">
                    Everything you need to write your masterpiece
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Powerful tools designed to keep you in the flow, organize your world, and polish your prose.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">

                {/* Card 1: AI Assistant (Large) */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">AI-Powered Co-author</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                Stuck on a scene? Let our AI suggest plot twists, describe settings, or refine your dialogue in real-time.
                            </p>
                        </div>

                        {/* Visual Mockup */}
                        <div className="mt-8 relative w-full h-48 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#333] p-4 overflow-hidden">
                            <div className="space-y-2">
                                <div className="h-2 bg-gray-200 dark:bg-[#333] rounded w-3/4"></div>
                                <div className="h-2 bg-gray-200 dark:bg-[#333] rounded w-full"></div>
                                <div className="h-2 bg-gray-200 dark:bg-[#333] rounded w-5/6"></div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#333] p-3 animate-float">
                                <div className="flex items-center gap-2 mb-2">
                                    <SparklesIcon className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-medium text-blue-500">AI Suggestion</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    "The rain lashed against the window, mirroring the storm brewing within him..."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>

                {/* Card 2: Real-time Sync (Regular) */}
                <div className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <BoltIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant Sync</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Never lose a word. Your work is saved and synced across all devices instantly.
                        </p>

                        {/* Visual */}
                        <div className="flex-1 relative flex items-center justify-center">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping"></div>
                                <div className="absolute inset-2 border-4 border-green-500/40 rounded-full"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <BoltIcon className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Organization (Regular) */}
                <div className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <FolderIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Organization</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Keep your characters, settings, and chapters organized with nested folders and tags.
                        </p>

                        {/* Visual */}
                        <div className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-100 dark:border-[#333] space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <FolderIcon className="w-3 h-3" />
                                <span>Drafts</span>
                            </div>
                            <div className="pl-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <DocumentTextIcon className="w-3 h-3" />
                                    <span>Chapter 1</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <DocumentTextIcon className="w-3 h-3" />
                                    <span>Chapter 2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Focus Mode (Large) */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <DocumentTextIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Distraction-Free Writing</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                Immerse yourself in your story with our clean, minimal interface designed for deep focus.
                            </p>
                        </div>

                        {/* Visual */}
                        <div className="mt-6 relative w-full h-40 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#333] shadow-inner p-6 flex flex-col items-center justify-center">
                            <p className="text-gray-400 dark:text-gray-600 text-sm font-serif italic">
                                "It was the best of times, it was the worst of times..."
                            </p>
                            <div className="mt-4 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                            </div>
                        </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-bl from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>

                {/* Card 5: Collaboration (Regular) */}
                <div className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <UsersIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Collaborate</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            Invite editors and beta readers to view or edit your manuscript securely.
                        </p>

                        {/* Visual */}
                        <div className="flex -space-x-4 justify-center mt-auto">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#333] border-2 border-white dark:border-[#212121] flex items-center justify-center text-xs font-bold">JD</div>
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-[#444] border-2 border-white dark:border-[#212121] flex items-center justify-center text-xs font-bold">AS</div>
                            <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-[#555] border-2 border-white dark:border-[#212121] flex items-center justify-center text-xs font-bold">+3</div>
                        </div>
                    </div>
                </div>

                {/* Card 6: CLI/Export (Regular) */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
                        <div className="flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <CommandLineIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Power User Tools</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                For those who prefer the keyboard. Full command palette, markdown support, and custom export scripts.
                            </p>
                        </div>

                        {/* Visual */}
                        <div className="flex-1 w-full bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 shadow-lg">
                            <div className="flex gap-1.5 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            </div>
                            <p>$ prodigy export --format pdf</p>
                            <p className="text-gray-500">Compiling manuscript...</p>
                            <p className="text-gray-500">Generating Table of Contents...</p>
                            <p>Done! ✨ book.pdf created</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

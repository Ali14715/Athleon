import './bootstrap';
import '../css/app.css';
import './index.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient();

createInertiaApp({
    title: (title) => `${title}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <TooltipProvider>
                        <NotificationProvider>
                            <App {...props} />
                            <Toaster />
                            <Sonner />
                        </NotificationProvider>
                    </TooltipProvider>
                </QueryClientProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#10b981',
        showSpinner: true,
    },
});
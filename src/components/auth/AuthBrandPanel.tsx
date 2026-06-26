import { motion } from "framer-motion";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo";
import {AUTH_FEATURES} from "@/utils/constants.ts";

export function AuthBrandPanel() {
    return (
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <MedneedsLogo size="lg" />
                </motion.div>

                {/* Features */}
                <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-3xl font-bold text-primary-foreground leading-tight">
                        A plataforma completa para<br />
                        <span className="text-accent">médicos organizados</span>
                    </h2>

                    <div className="space-y-6">
                        {AUTH_FEATURES.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="flex items-start gap-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary-foreground">{feature.title}</h3>
                                    <p className="text-primary-foreground/70 text-sm">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    className="text-primary-foreground/50 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    © 2025 Medneeds. Todos os direitos reservados.
                </motion.p>
            </div>
        </div>
    );
}

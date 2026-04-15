"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
};

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = "md",
    showCloseButton = true,
}: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative bg-card border border-border w-full ${sizeClasses[size]} rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]`}
                    >
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        )}
                        <h2 className="font-serif text-2xl mb-2">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">
                                {subtitle}
                            </p>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex gap-4 mt-10">{children}</div>;
}

export function ModalButton({
    children,
    onClick,
    variant = "secondary",
    className = "",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary";
    className?: string;
}) {
    const baseClasses = "flex-1 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all";
    const variantClasses = {
        primary: "bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20",
        secondary: "border border-border hover:bg-muted",
    };

    return (
        <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </button>
    );
}

export function FormField({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">
                {label}
            </label>
            {children}
        </div>
    );
}

export function FormInput({
    type = "text",
    value,
    onChange,
    placeholder,
    className = "",
}: {
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all ${className}`}
        />
    );
}

export function FormTextarea({
    value,
    onChange,
    placeholder,
    rows = 4,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
        />
    );
}

export function FormSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

export function FormCheckbox({
    id,
    checked,
    onChange,
    label,
}: {
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}) {
    return (
        <div className="flex items-center space-x-3 p-2">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
                className="accent-primary"
            />
            <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                {label}
            </label>
        </div>
    );
}
import React from "react";

export type TabItem<T extends string = string> = {
    id: T;
    label: string;
    disabled?: boolean;
    badge?: string; // ex: "!"
};

type AppTabsProps<T extends string> = {
    tabs: TabItem<T>[];
    activeTab: T;
    onChange: (tab: T) => void;
};

export function AppTabs<T extends string>({
    tabs,
    activeTab,
    onChange,
}: AppTabsProps<T>) {
    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            disabled={tab.disabled}
                            onClick={() => onChange(tab.id)}
                            className={[
                                "relative rounded-xl px-4 py-2 text-sm font-medium transition",
                                isActive
                                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                                tab.disabled
                                    ? "opacity-40 cursor-not-allowed"
                                    : "cursor-pointer",
                            ].join(" ")}
                        >
                            {tab.label}

                            {tab.badge && (
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

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
            <div className="flex border-b border-gray-200 gap-1">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            disabled={tab.disabled}
                            onClick={() => onChange(tab.id)}
                            className={[
                                "relative px-4 py-2 text-sm font-medium transition",
                                "border-b-2",
                                isActive
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-blue-500",
                                tab.disabled
                                    ? "opacity-40 cursor-not-allowed"
                                    : "cursor-pointer",
                            ].join(" ")}
                        >
                            {tab.label}

                            {tab.badge && (
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-2 py-0.5">
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

import React from 'react'
const tooltipPositionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
};
interface AppTooltipProps {
     tooltipPosition?: "top" | "right" | "bottom" | "left";
     text:string;
}
const AppTooltip = ({ text, tooltipPosition = "top" }: AppTooltipProps) => {
    return (
        <div className="relative group">
            <span className="cursor-pointer text-gray-400 text-sm">ⓘ</span>

            <div
                className={[
                    "absolute z-50 hidden group-hover:block",
                    "rounded-md bg-gray-800 px-2 py-1 text-xs text-white",
                    "whitespace-nowrap shadow-lg",
                    tooltipPositionClass[tooltipPosition],
                ].join(" ")}
            >
                {text}
            </div>
        </div>

    )
}

export default AppTooltip
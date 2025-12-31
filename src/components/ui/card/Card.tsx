import React, { type ReactNode } from 'react'
interface CardProps {
    children: ReactNode | ReactNode[]
}
const Card = (props: CardProps) => {
    return (
        <div className='flex flex-col gap-5 w-full rounded overflow-hidden shadow-lg p-10'>
            {props.children}
        </div>
    )

}

export default Card;

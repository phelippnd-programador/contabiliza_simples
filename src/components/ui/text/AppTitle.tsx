interface AppTextProps{
    text:string;
}
const AppTitle = (props:AppTextProps) => {
  return (
    <h1 className='font-semibold text-4xl tracking-tight font-amarna text-slate-900 dark:text-slate-100'>{props.text}</h1>
  )
}
export const AppSubTitle = (props:AppTextProps) => {
  return (
    <h4 className='text-sm uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-300'>{props.text}</h4>
  )
}
export const AppLabel = (props:AppTextProps) => {
  return (
    <label className='text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-300'>{props.text}</label>
  )
}

export default AppTitle

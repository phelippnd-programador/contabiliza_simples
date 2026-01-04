interface AppTextProps{
    text:string;
}
const AppTitle = (props:AppTextProps) => {
  return (
    <h1 className='font-bold text-3xl font-amarna text-gray-900 dark:text-gray-100'>{props.text}</h1>
  )
}
export const AppSubTitle = (props:AppTextProps) => {
  return (
    <h4 className='font-bold text-1xl font-amarna text-gray-700 dark:text-gray-200'>{props.text}</h4>
  )
}
export const AppLabel = (props:AppTextProps) => {
  return (
    <label className='font-bold text-1xl font-amarna text-gray-700 dark:text-gray-200'>{props.text}</label>
  )
}

export default AppTitle

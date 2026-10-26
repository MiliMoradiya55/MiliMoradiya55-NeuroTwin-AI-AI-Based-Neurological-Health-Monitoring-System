import { useAppStore } from './store'

export const useAppDispatch = () => useAppStore

export const useAppSelector = <T,>(selector: (state: ReturnType<typeof useAppStore.getState>) => T) => {
  return selector(useAppStore.getState())
}

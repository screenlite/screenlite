import { screenRequest, ScreenRequestData } from '../requests/screenRequest'

export const screenQuery = (data: ScreenRequestData) => ({
    queryKey: ['screen', data],
    queryFn: async () => screenRequest(data),
    refetchInterval: 30000,
})
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { BASE_URL } from "./const";
import { globalStore, setIsLoading, setToastText } from "./store";
const baseApi = axios.create({
    baseURL: BASE_URL,
    timeout: 5000
})
type SuccessRes<T> = (AxiosResponse<T> & { isSuccess: true })
type ErrorRes = { isSuccess: false, errorMessage: string }
type ApiResponse<T> = SuccessRes<T> | ErrorRes
const handleError = (e: any): ErrorRes => {
    const axiosError = e as AxiosError;
    let errorMessage = ''
    if (axiosError.response) {
        errorMessage = typeof axiosError.response.data === 'string' ?
            axiosError.response.data
            : "發生錯誤"
        globalStore.dispatch(setToastText(errorMessage))
    } else if (axiosError.request) {
        errorMessage = '伺服器未回應'
        globalStore.dispatch(setToastText('伺服器未回應'))
    } else {
        errorMessage = '請求設置時出現錯誤'

        globalStore.dispatch(setToastText('請求設置時出現錯誤'))
    }
    return {
        errorMessage,
        isSuccess: false
    }
}
const get = async <ResponseDataType>(url: string, useLoading: boolean = true, config?: AxiosRequestConfig): Promise<ApiResponse<ResponseDataType>> => {
    try {
        if (useLoading) {
            globalStore.dispatch(setIsLoading(true))
        }
        const result = await baseApi.get<ResponseDataType>(url, config)
        return { ...result, isSuccess: true } as ApiResponse<ResponseDataType>
    } catch (e) {
        return handleError(e)
    } finally {
        if (useLoading) {
            globalStore.dispatch(setIsLoading(false))
        }
    }
}
const post = async<PostData, ResponseDataType>(url: string, data: PostData): Promise<ApiResponse<ResponseDataType>> => {
    try {
        globalStore.dispatch(setIsLoading(true))
        const result = await baseApi.post<ResponseDataType>(url, data)
        return { ...result, isSuccess: true } as ApiResponse<ResponseDataType>
    } catch (e) {
        return handleError(e)
    } finally {
        globalStore.dispatch(setIsLoading(false))
    }
}

export default {
    get, post
}
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { BASE_URL } from "./const";
import { globalStore, setIsLoading } from "./store";
const baseApi = axios.create({
    baseURL: BASE_URL,
    timeout: 5000
})
type SuccessRes<T> = (AxiosResponse<T> & { isSuccess: true })
type ErrorRes<T> = (Partial<AxiosResponse<T>> & { isSuccess: false })
type ApiResponse<T> = SuccessRes<T> | ErrorRes<T>

const get = async <ResponseDataType>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<ResponseDataType>> => {
    try {
        globalStore.dispatch(setIsLoading(true))
        const result = await baseApi.get<ResponseDataType>(url, config)
        return { ...result, isSuccess: true } as ApiResponse<ResponseDataType>
    } catch (e) {
        const axiosError = e as AxiosError;
        return {
            ...axiosError.response,
            isSuccess: false
        } as ApiResponse<ResponseDataType>
    } finally {
        globalStore.dispatch(setIsLoading(false))
    }
}
const post = async<PostData, ResponseDataType>(url: string, data: PostData): Promise<ApiResponse<ResponseDataType>> => {
    try {
        globalStore.dispatch(setIsLoading(true))
        const result = await baseApi.post<ResponseDataType>(url, data)
        return { ...result, isSuccess: true } as ApiResponse<ResponseDataType>
    } catch (e) {
        const axiosError = e as AxiosError;
        return {
            ...axiosError.response,
            isSuccess: false
        } as ApiResponse<ResponseDataType>
    }finally {
        globalStore.dispatch(setIsLoading(false))
    }
}

export default {
    get, post
}
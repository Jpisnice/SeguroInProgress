import { env } from "@/next.config"
import { resolve } from "styled-jsx/css"

const { default: axios } = require("axios")

const get = async (api,body={}) => {
    const response = await axios.get(env.apiUrl+api,body)
    // console.log(JSON.parse(response.data))
    return response?.data
}

const post = async (api,body={}) => {
    const response = await axios.post(env.apiUrl+api,body)

    return response?.data
}
const put = async (api,body={}) => {
    const response = await axios.put(env.apiUrl+api,body)

    return response?.data
}
const drop = async (api,body={}) => {
    const response = await axios.delete(env.apiUrl+api,body)

    return response?.data
}

export default {
    get,
    post,
    put,
    drop
}
import {z} from 'zod'

export const usernameValidation = z
.string()
.min(2,"username must be at least 2 characters")
.max(20,"username must be not more than 20 characters")
.regex(/^[a-zA-Z0-9_]+$/,'Username must not contain special characters')


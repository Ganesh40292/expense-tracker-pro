export const isEmailValid = (email = '') => /\S+@\S+\.\S+/.test(email)

export const isPasswordValid = (password = '') => password.length >= 6

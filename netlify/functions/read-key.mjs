export const handler = async () => {
    const key = process.env.SAMPLE_KEY
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `${key}`
        })
    }
}

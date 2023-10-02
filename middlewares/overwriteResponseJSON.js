
const overwriteResponseJSON = (req, res, next) => {
    const JSONSender = res.json
    res.json = (data) => {
        res.json = JSONSender

        if (data?.code && isFinite(data.code)) {
            res.status(data.code).json(data)
        } else {
            res.status(200).json(data)
        }
    }
    next()
}

export default overwriteResponseJSON
